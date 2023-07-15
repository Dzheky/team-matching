import random
import uuid

import numpy as np
import scipy
import sqlite3

from flask_cors import CORS
from flask import jsonify
from flask import Flask
from flask import request, Response

app = Flask(__name__)
CORS(app)


def get_db_connection():
    con = sqlite3.connect('matching.db', check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con


def reset_db():
    con = get_db_connection()
    cur = con.cursor()
    # delete if exists
    cur.execute("DROP TABLE IF EXISTS teams")
    cur.execute("DROP TABLE IF EXISTS members")
    cur.execute("DROP TABLE IF EXISTS criteria")
    cur.execute("DROP TABLE IF EXISTS required_members")
    cur.execute("DROP TABLE IF EXISTS required_criteria")

    cur.execute("CREATE TABLE teams (id TEXT PRIMARY KEY,"
                "name TEXT, description TEXT, start TEXT, end TEXT)")

    cur.execute("CREATE TABLE required_members (id TEXT PRIMARY KEY,"
                "role TEXT, count INTEGER, team_id TEXT, skills TEXT,"
                "FOREIGN KEY (team_id) REFERENCES teams(id))")
    cur.execute("CREATE TABLE required_criteria (id TEXT PRIMARY KEY,"
                "required_member_id TEXT, criteria TEXT, value INTEGER,"
                "FOREIGN KEY (required_member_id) REFERENCES required_members(id))")

    cur.execute("CREATE TABLE members (id TEXT PRIMARY KEY,"
                "name TEXT, role TEXT, team_id TEXT, availability_start TEXT, availability_end TEXT, skills TEXT,"
                "FOREIGN KEY (team_id) REFERENCES teams(id))")
    cur.execute("CREATE TABLE criteria (id TEXT PRIMARY KEY,"
                "member_id TEXT, criteria TEXT, value INTEGER,"
                "FOREIGN KEY (member_id) REFERENCES members(id))")

    con.commit()
    con.close()


def add_mock_teams_to_db():
    con = get_db_connection()
    cur = con.cursor()
    mock_teams = [
        {
            "id": 0,
            "name": "Developing Financial Application",
            "description": "Bank application for managing your money and investments in one place",
            "time_frame": {
                "start": "2021-01-01",
                "end": "2021-02-01"
            },
            "required_members": [
                {
                    "id": 0,
                    "role": "Frontend Developer",
                    "count": 2,
                    "required_skills": ["React", "TypeScript"],
                    "criteria": {
                        "yoe": 3,
                        "seniority": 54,
                        "performance": 19,
                    }
                },
                {
                    "id": 1,
                    "role": "Designer",
                    "count": 2,
                    "required_skills": ["Figma", "UX"],
                    "criteria": {
                        "yoe": 11,
                        "seniority": 45,
                        "performance": 68,
                    },
                }
            ],
        },
        {
            "id": 1,
            "name": "Marketing Web Page",
            "description": "Web page to sell banking products and services",
            "time_frame": {
                "start": "2021-01-01",
                "end": "2021-02-01"
            },
            "required_members": [
                {
                    "id": 2,
                    "role": "Frontend Developer",
                    "count": 1,
                    "required_skills": ["React", "TypeScript"],
                    "criteria": {
                        "yoe": 9,
                        "seniority": 43,
                        "performance": 27,
                    }
                },
                {
                    "id": 3,
                    "role": "Designer",
                    "count": 1,
                    "required_skills": ["Figma", "UX"],
                    "criteria": {
                        "yoe": 10,
                        "seniority": 34,
                        "performance": 56,
                    },
                }
            ],
        }
    ]
    for team in mock_teams:
        cur.execute("INSERT INTO teams (id, name, description, start, end) VALUES (?, ?, ?, ?, ?)",
                    (team["id"], team["name"], team["description"], team["time_frame"]["start"],
                     team["time_frame"]["end"]))
        for required_member in team["required_members"]:
            string_skills = ""
            for skill in required_member["required_skills"]:
                string_skills += skill + ","
            cur.execute("INSERT INTO required_members (id, role, count, team_id, skills)"
                        "VALUES (?, ?, ?, ?, ?)",
                        (required_member["id"], required_member["role"], required_member["count"], team["id"],
                         string_skills[:-1]))
            for criteria in required_member["criteria"]:
                cur.execute("INSERT INTO required_criteria (required_member_id, criteria, value) VALUES (?, ?, ?)",
                            (required_member["id"], criteria, required_member["criteria"][criteria]))

    con.commit()
    con.close()


def db_members_to_json(db_members):
    con = get_db_connection()
    cur = con.cursor()
    result_members = []
    for db_member in db_members:
        criteria = cur.execute("SELECT * FROM criteria WHERE member_id = ?", (db_member[0],)).fetchall()
        result_member = {
            "id": db_member[0],
            "name": db_member[1],
            "role": db_member[2],
            "team_id": db_member[3],
            "availability": {
                "start": db_member[4],
                "end": db_member[5]
            },
            "skills": [],
            "criteria": {}
        }

        for skill in db_member[6].split(","):
            result_member["skills"].append(skill)

        for criteria in criteria:
            result_member["criteria"][criteria[2]] = criteria[3]
        result_members.append(result_member)
    con.close()
    return result_members


def db_teams_to_json(db_teams):
    con = get_db_connection()
    cur = con.cursor()
    result_teams = []
    for db_team in db_teams:
        required_members = cur.execute("SELECT * FROM required_members WHERE team_id = ?", (db_team[0],)).fetchall()
        result_team = {
            "id": db_team[0],
            "name": db_team[1],
            "description": db_team[2],
            "time_frame": {
                "start": db_team[3],
                "end": db_team[4]
            },
            "required_members": []
        }
        for required_member in required_members:
            required_member_criteria = cur.execute("SELECT * FROM required_criteria WHERE required_member_id = ?",
                                                   (required_member[0],)).fetchall()
            result_required_member = {
                "id": required_member[0],
                "role": required_member[1],
                "count": required_member[2],
                "required_skills": [],
                "criteria": {}
            }
            for skill in required_member[4].split(","):
                result_required_member["required_skills"].append(skill)
            for criteria in required_member_criteria:
                result_required_member["criteria"][criteria[2]] = criteria[3]
            result_team["required_members"].append(result_required_member)
        result_teams.append(result_team)
    con.close()
    return result_teams


def add_and_generate_mock_members(count):
    con = get_db_connection()
    cur = con.cursor()
    local_members = generate_members(count)
    for member in local_members:
        string_skills = ""
        for skill in member["skills"]:
            string_skills += skill + ","
        cur.execute("INSERT INTO members (id, name, role, team_id, availability_start, availability_end, skills)"
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (member["id"], member["name"], member["role"], member["team_id"], member["availability"]["start"],
                     member["availability"]["end"], string_skills[:-1]))
        for criteria in member["criteria"]:
            cur.execute("INSERT INTO criteria (member_id, criteria, value) VALUES (?, ?, ?)",
                        (member["id"], criteria, member["criteria"][criteria]))

    con.commit()
    db_members = cur.execute("SELECT * FROM members").fetchall()
    result_members = db_members_to_json(db_members)
    con.close()

    return result_members


def generate_random_name():
    names = ["John", "Jane", "Mark", "Peter", "Michael", "Anna", "Maria", "Katarina", "Nikola", "Viktor", "Milos",
             "Ivan", "Jovan", "Stefan", "Aleksandar", "Sara", "Sofija", "Mia", "Lena", "Luka", "Nikola", "Nikolina",
             "Nina", "Petar", "Pavle", "Milica", "Milan"]
    surnames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
                "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez",
                "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez",
                "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter",
                "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards",
                "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy",
                "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray",
                "Ramirez", "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood", "Barnes"]
    return names[random.randint(0, len(names) - 1)] + " " + surnames[random.randint(0, len(surnames) - 1)]


def generate_members(count):
    potential_roles = ["Frontend Developer", "Designer", "Backend Developer", "QA"]
    potential_skills = {
        "Frontend Developer": ["React", "TypeScript", "Redux", "JavaScript"],
        "Designer": ["UX", "Figma", "Sketch", "Adobe XD"],
        "Backend Developer": ["Python", "Java", "C++", "C#", "NodeJS"],
        "QA": ["Selenium", "Cypress", "Jest", "Mocha"],
    }
    local_members = []
    for i in range(count):
        role_seed = random.randint(0, len(potential_roles) - 1)
        role = potential_roles[role_seed]
        skills = []
        random_sorted_skills = sorted(potential_skills[role], key=lambda x: random.random())
        for j in range(random.randint(1, len(potential_skills[role]))):
            skills.append(random_sorted_skills[j])
        random_yoe = random.randint(0, 100)
        random_seniority = random.randint(0, 100)
        random_performance = random.randint(0, 100)
        member_id = str(uuid.uuid4())
        local_members.append({
            "id": member_id,
            "name": generate_random_name(),
            "role": role,
            "skills": skills,
            "team_id": None,
            "availability": {
                "start": "2021-01-01",
                "end": "2021-03-01"
            },
            "criteria": {
                "yoe": random_yoe,
                "seniority": random_seniority,
                "performance": random_performance,
            },
        })
    return local_members


def get_weighted_score(member, required_member):
    weights = {}
    for key in required_member["criteria"]:
        weights[key] = required_member["criteria"][key] / 100

    score = 0
    for key in required_member["criteria"]:
        if key in member["criteria"]:
            score += weights[key] * member["criteria"][key]
    return score


def validate_member(local_members, normalized_members, required_member, selected_members, team, team_structure, count):
    lowest_distance = 1000000000
    lowest_member = None
    team_point = []
    for criteria in required_member["criteria"]:
        team_point.append(required_member["criteria"][criteria])
    team_point = np.array(team_point)
    points = []
    for member in local_members:
        skills_match = is_valid_skills(member, required_member)
        if not skills_match:
            continue
        if member["role"] == required_member["role"] and member["id"] not in selected_members:
            member_point = []
            for criteria in required_member["criteria"]:
                if criteria in member["criteria"]:
                    member_point.append(member["criteria"][criteria])
                else:
                    member_point.append(0)
            member_point = np.array(member_point)
            points.append({
                "id": member["id"],
                "point": member_point,
            })
    for point in points:
        distance = np.linalg.norm(team_point - point["point"])
        if distance < lowest_distance:
            lowest_distance = distance
            lowest_member = point
    if lowest_member is not None:
        selected_members[lowest_member["id"]] = lowest_member
        team_structure[team["id"]][required_member["role"]].append(normalized_members[lowest_member["id"]])

        if count < required_member["count"]:
            count += 1
            validate_member(local_members, normalized_members, required_member, selected_members, team, team_structure,
                            count)


def is_valid_skills(member, required_member):
    skills_match = True
    for skill in required_member["required_skills"]:
        if skill not in member["skills"]:
            skills_match = False
            break
    return skills_match


def get_teams():
    con = get_db_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM teams")
    teams_db = cur.fetchall()
    teams = db_teams_to_json(teams_db)
    normalized_teams = {}
    for team in teams:
        normalized_teams[team["id"]] = team.copy()
        normalized_teams[team["id"]]["required_members"] = {}
        for required_member in team["required_members"]:
            normalized_teams[team["id"]]["required_members"][required_member["role"]] = required_member
    con.close()
    return normalized_teams, teams


@app.route('/teams')
def get_teams_handler():
    normalized_teams, teams = get_teams()
    return jsonify(teams)


@app.route('/team/<team_id>', methods=['PUT', 'PATCH'])
def patch_team(team_id):
    con = get_db_connection()
    cur = con.cursor()
    team = request.get_json()
    try:
        cur.execute(
            "UPDATE teams SET name = ?, description = ?, start = ?, end = ? "
            "WHERE id = ?",
            (
                team["name"],
                team["description"],
                team["time_frame"]["start"],
                team["time_frame"]["end"],
                team_id
            )
        )
        cur.execute("DELETE FROM required_members WHERE team_id = ?", (team_id,))
        for required_member in team["required_members"]:
            string_skills = ""
            for skill in required_member["required_skills"]:
                string_skills += skill + ","
            required_member_id = str(uuid.uuid4())
            cur.execute("INSERT INTO required_members (id, role, count, team_id, skills)"
                        "VALUES (?, ?, ?, ?, ?)",
                        (required_member_id, required_member["role"], required_member["count"], team_id,
                         string_skills[:-1]))
            cur.execute("DELETE FROM required_criteria WHERE required_member_id = ?", (required_member_id,))
            for criteria in required_member["criteria"]:
                cur.execute("INSERT INTO required_criteria (id, required_member_id, criteria, value) "
                            "VALUES (?, ?, ?, ?)",
                            (str(uuid.uuid4()), required_member_id, criteria, required_member["criteria"][criteria]))
        con.commit()
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({"message": "Error updating team"}), 400
    con.close()
    return jsonify({"message": "OK"})


@app.route('/team/<team_id>', methods=['DELETE'])
def delete_team(team_id):
    con = get_db_connection()
    cur = con.cursor()
    try:
        cur.execute("DELETE FROM teams WHERE id = ?", (team_id,))
        required_members = cur.execute("SELECT * FROM required_members WHERE team_id = ?", (team_id,)).fetchall()
        for required_member in required_members:
            cur.execute("DELETE FROM required_criteria WHERE required_member_id = ?", (required_member[0],))
        cur.execute("DELETE FROM required_members WHERE team_id = ?", (team_id,))
        con.commit()
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({"message": "Error deleting team"}), 400
    con.close()
    return jsonify({"message": "OK"})


@app.route('/teams', methods=['POST'])
def add_team():
    con = get_db_connection()
    cur = con.cursor()
    team = request.get_json()
    try:
        cur.execute("INSERT INTO teams (id, name, description, start, end)"
                    "VALUES (?, ?, ?, ?, ?)",
                    (team["id"], team["name"], team["description"], team["time_frame"]["start"],
                     team["time_frame"]["end"]))
        team_id = team["id"]
        for required_member in team["required_members"]:
            string_skills = ""
            for skill in required_member["required_skills"]:
                string_skills += skill + ","
            required_member_id = str(uuid.uuid4())
            cur.execute("INSERT INTO required_members (id, role, count, team_id, skills)"
                        "VALUES (?, ?, ?, ?, ?)",
                        (required_member_id, required_member["role"], required_member["count"], team_id,
                         string_skills[:-1]))
            for criteria in required_member["criteria"]:
                cur.execute("INSERT INTO required_criteria (id, required_member_id, criteria, value) "
                            "VALUES (?, ?, ?, ?)",
                            (str(uuid.uuid4()), required_member_id, criteria, required_member["criteria"][criteria]))
        con.commit()
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({"message": "Error adding team"}), 400
    con.close()
    return jsonify({"message": "OK"})


@app.route('/generate_members')
def generate_members_route():
    if request.args.get("count") is None:
        code = 400
        return Response("{\"message\": \"count is required\"}", status=code, mimetype='application/json')
    count = int(request.args.get("count"))
    local_members = add_and_generate_mock_members(count)
    return jsonify(local_members)


@app.route('/generate_teams')
def generate_teams_route():
    add_mock_teams_to_db()
    return jsonify({"message": "OK"})


@app.route('/members')
def get_members():
    con = get_db_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM members")
    members = cur.fetchall()
    members_json = db_members_to_json(members)
    con.close()
    return members_json


@app.route('/reset')
def reset():
    reset_db()
    return jsonify({"message": "OK"})


@app.route('/member/<member_id>', methods=['DELETE'])
def delete_member(member_id):
    con = get_db_connection()
    cur = con.cursor()
    try:
        cur.execute("DELETE FROM members WHERE id = ?", (member_id,))
        cur.execute("DELETE FROM criteria WHERE member_id = ?", (member_id,))
        con.commit()
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({"message": "Error deleting member"}), 400
    con.close()
    return jsonify({"message": "OK"})


@app.route('/member', methods=['POST'])
def add_member():
    con = get_db_connection()
    cur = con.cursor()
    member = request.get_json()
    string_skills = ""
    for skill in member["skills"]:
        string_skills += skill + ","
    string_skills = string_skills[:-1]
    try:
        member_id = str(uuid.uuid4())
        cur.execute("INSERT INTO members (id, name, role, skills)"
                    "VALUES (?, ?, ?, ?)",
                    (member_id, member["name"], member["role"], string_skills))

        for criteria in member["criteria"]:
            cur.execute("INSERT INTO criteria (member_id, criteria, value) VALUES (?, ?, ?)",
                        (member_id, criteria, member["criteria"][criteria]))
        con.commit()
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({"message": "Error adding member"}), 400
    con.close()
    return jsonify({"message": "OK"})


@app.route('/member/<member_id>', methods=['PUT', 'PATCH'])
def update_member(member_id):
    con = get_db_connection()
    cur = con.cursor()
    member = request.get_json()
    string_skills = ""
    for skill in member["skills"]:
        string_skills += skill + ","
    string_skills = string_skills[:-1]
    try:
        cur.execute(
            "UPDATE members SET name = ?, role = ?, skills = ?, team_id = ?, availability_start = ?,"
            "availability_end = ? "
            "WHERE id = ?",
            (
                member["name"],
                member["role"],
                string_skills,
                member["team_id"],
                member["availability"]["start"],
                member["availability"]["end"],
                member_id
            )
        )
        cur.execute("DELETE FROM criteria WHERE member_id = ?", (member_id,))
        for criteria in member["criteria"]:
            cur.execute("INSERT INTO criteria (member_id, criteria, value) VALUES (?, ?, ?)",
                        (member_id, criteria, member["criteria"][criteria]))
        con.commit()
    except Exception as e:
        print(e)
        con.rollback()
        return jsonify({"message": "Error updating member"}), 400
    con.close()
    return jsonify({"message": "OK"})


@app.route('/match')
def match():
    normalized_teams, teams = get_teams()
    members = get_members()

    normalized_members = {}
    for member in members:
        normalized_members[member["id"]] = member

    team_structure = {}
    selected_members = {}

    for team in teams:
        for required_member in team["required_members"]:
            if team["id"] not in team_structure:
                team_structure[team["id"]] = {}
            if required_member["role"] not in team_structure[team["id"]]:
                team_structure[team["id"]][required_member["role"]] = []

            count = 1
            validate_member(members, normalized_members, required_member, selected_members, team, team_structure, count)

    list_of_all_roles = []
    for team in team_structure:
        for role in team_structure[team]:
            list_of_all_roles.append(role)
    list_of_all_roles = list(set(list_of_all_roles))

    # create two-dimensional array per role where each row is a team and each column is a weighted score of a person
    for role in list_of_all_roles:
        two_dimensional_array = []
        list_of_all_members = []
        for team in team_structure:
            for member in team_structure[team][role]:
                list_of_all_members.append(member)

        team_keys = list(team_structure.keys())
        row_keys_to_team_keys = {}
        current_row = 0

        def make_row_of_weights(members_list, local_team):
            local_row = []
            for m in members_list:
                valid_skills = is_valid_skills(m, normalized_teams[local_team]["required_members"][role])
                if valid_skills:
                    weight = get_weighted_score(m, normalized_teams[local_team]["required_members"][role])
                    local_row.append(weight)
                else:
                    local_row.append(0)

            return local_row

        for team in team_keys:
            count = 1
            while count <= normalized_teams[team]["required_members"][role]["count"]:
                row_keys_to_team_keys[current_row] = team
                row = make_row_of_weights(list_of_all_members, team)
                two_dimensional_array.append(row)
                current_row += 1
                count += 1

        if len(two_dimensional_array) > len(two_dimensional_array[0]):
            for i in range(len(two_dimensional_array)):
                two_dimensional_array[i].append(0)

        if len(two_dimensional_array) < len(two_dimensional_array[0]):
            two_dimensional_array.append([0 for i in range(len(two_dimensional_array[0]))])

        row_ind, col_ind = scipy.optimize.linear_sum_assignment(np.array(two_dimensional_array), True)
        for i in row_ind:
            if i not in row_keys_to_team_keys:
                continue
            team_structure[row_keys_to_team_keys[i]][role] = []

        for i in row_ind:
            if i not in row_keys_to_team_keys or col_ind[i] >= len(list_of_all_members):
                continue
            team_structure[row_keys_to_team_keys[i]][role].append(list_of_all_members[col_ind[i]])

    return {
        "teams": team_structure,
    }


if __name__ == '__main__':
    app.run()
