import random
import numpy as np
import scipy

from flask import Flask

app = Flask(__name__)

mock_teams = [
    {
        "id": 1,
        "name": "Developing Financial Application",
        "time_frame": {
            "start": "2021-01-01",
            "end": "2021-02-01"
        },
        "required_members": [
            {
                "role": "Frontend Developer",
                "count": 2,
                "required_skills": ["React", "TypeScript"],
                "criteria": {
                    "yoe": 8,
                    "seniority": 8,
                    "performance": 8,
                }
            },
            {
                "role": "Designer",
                "count": 1,
                "required_skills": ["Figma", "UX"],
                "criteria": {
                    "yoe": 11,
                    "seniority": 10,
                    "performance": 10,
                },
            }
        ],
    },
    {
        "id": 2,
        "name": "Developing Financial Application",
        "time_frame": {
            "start": "2021-01-01",
            "end": "2021-02-01"
        },
        "required_members": [
            {
                "role": "Frontend Developer",
                "count": 1,
                "required_skills": ["React", "TypeScript"],
                "criteria": {
                    "yoe": 9,
                    "seniority": 9,
                    "performance": 9,
                }
            },
            {
                "role": "Designer",
                "count": 1,
                "required_skills": ["Figma", "UX"],
                "criteria": {
                    "yoe": 10,
                    "seniority": 10,
                    "performance": 10,
                },
            }
        ],
    }
]


def generate_members(count):
    potential_roles = ["Frontend Developer", "Designer", "Backend Developer", "QA"]
    potential_skills = {
        "Frontend Developer": ["React", "TypeScript", "Redux", "JavaScript"],
        "Designer": ["UX", "Sketch", "Adobe XD"],
        "Backend Developer": ["Python", "Java", "C++", "C#", "NodeJS"],
        "QA": ["Selenium", "Cypress", "Jest", "Mocha"],
    }
    members = []
    for i in range(count):
        role_seed = random.randint(0, len(potential_roles) - 1)
        role = potential_roles[role_seed]
        skills = []
        random_sorted_skills = sorted(potential_skills[role], key=lambda x: random.random())
        for j in range(random.randint(1, len(potential_skills[role]))):
            skills.append(random_sorted_skills[j])
        random_yoe = random.randint(0, 10)
        random_seniority = random.randint(0, 10)
        random_performance = random.randint(0, 10)
        members.append({
            "id": i,
            "name": "Member " + str(i),
            "role": role,
            "skills": skills,
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
    return members


def get_weighted_score(member, required_member):
    weights = {}
    for key in required_member["criteria"]:
        weights[key] = required_member["criteria"][key] / 100

    score = 0
    for key in required_member["criteria"]:
        score += weights[key] * member["criteria"][key]
    return score


def validate_member(members, normalized_members, required_member, selected_members, team, team_structure, count):
    lowest_distance = 1000000000
    lowest_member = None
    team_point = []
    for criteria in required_member["criteria"]:
        team_point.append(required_member["criteria"][criteria])
    team_point = np.array(team_point)
    points = []
    for member in members:
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
            validate_member(members, normalized_members, required_member, selected_members, team, team_structure, count)


def is_valid_skills(member, required_member):
    skills_match = True
    for skill in required_member["required_skills"]:
        if skill not in member["skills"]:
            skills_match = False
            break
    return skills_match


@app.route('/match')
def match():
    teams = mock_teams
    normalized_teams = {}
    for team in teams:
        normalized_teams[team["id"]] = team.copy()
        normalized_teams[team["id"]]["required_members"] = {}
        for required_member in team["required_members"]:
            normalized_teams[team["id"]]["required_members"][required_member["role"]] = required_member

    members = generate_members(100)
    members.append({
        "id": 500,
        "name": "Member 100",
        "role": "Frontend Developer",
        "skills": ["React", "TypeScript", "Redux", "JavaScript"],
        "availability": {
            "start": "2021-01-01",
            "end": "2021-03-01"
        },
        "criteria": {
            "yoe": 10,
            "seniority": 10,
            "performance": 10,
        },
    })

    members.append({
        "id": 501,
        "name": "Member 101",
        "role": "Designer",
        "skills": ["Figma", "UX", "Sketch", "Adobe XD"],
        "availability": {
            "start": "2021-01-01",
            "end": "2021-03-01"
        },
        "criteria": {
            "yoe": 100,
            "seniority": 100,
            "performance": 100,
        },
    })

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
