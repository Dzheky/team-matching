import requests
import json
from prettytable import PrettyTable

f = open('evaluation_data.json', 'r')
evaluation_data = json.load(f)

# Define the ground truth
ground_truth = {
    'team1': ['member1', 'member2'],
    # ... (define for other teams)
}


def evaluateCriteria(criteria, required_criteria):
    valuation = criteria / required_criteria
    if valuation > 1:
        return 1
    else:
        return valuation


def evaluate(matched, required):
    total_accuracy = 0
    total_teams = len(required)
    for requiredTeam in required:
        team_id = requiredTeam['id']
        team_accuracy = 0
        number_of_roles = len(requiredTeam['required_members'])
        for requiredMember in requiredTeam['required_members']:
            count = requiredMember['count']
            role = requiredMember['role']
            role_accuracy = 0
            for i in range(count):
                member_accuracy = 0
                number_of_criteria = 0
                if len(matched[team_id][role]) > i:
                    member = matched[team_id][role][i]
                    required_criteria = requiredMember['criteria']
                    matched_criteria = member['criteria']
                    for criteria in required_criteria.keys():
                        number_of_criteria += 1
                        member_accuracy += evaluateCriteria(matched_criteria[criteria], required_criteria[criteria])
                if number_of_criteria > 0:
                    member_accuracy = member_accuracy / number_of_criteria
                    role_accuracy += member_accuracy
            role_accuracy = role_accuracy / count
            team_accuracy += role_accuracy
        team_accuracy = team_accuracy / number_of_roles
        total_accuracy += team_accuracy
    total_accuracy = total_accuracy / total_teams
    return total_accuracy


def get_current_accuracy():
    match_response = requests.get('http://127.0.0.1:5000/match')
    teams_response = requests.get('http://127.0.0.1:5000/teams')

    if match_response.status_code == 200 and teams_response.status_code == 200:
        matched_data = match_response.json()
        teams_data = teams_response.json()

        predicted = matched_data['teams']

        return evaluate(predicted, teams_data)
    else:
        print("Mathc Error: {}".format(match_response.status_code))
        print("Teams Error: {}".format(teams_response.status_code))
        return 0


def reset_db():
    response = requests.get('http://127.0.0.1:5000/reset')
    if response.status_code == 200:
        print("DB reset successful")
    else:
        print("DB reset failed: {}".format(response.status_code))


def generate_ground_truth():
    list_of_ground_truth_teams = evaluation_data['ground_truth_teams']
    list_of_ground_truth_members = evaluation_data['ground_truth_members']

    for team in list_of_ground_truth_teams:
        requests.post('http://127.0.0.1:5000/teams', json=team)

    for member in list_of_ground_truth_members:
        requests.post('http://127.0.0.1:5000/member', json=member)


def generate_teams():
    request = requests.get('http://127.0.0.1:5000/generate_teams')
    if request.status_code == 200:
        print("Teams generated")
    else:
        print("Teams generation failed: {}".format(request.status_code))


def generate_members(count):
    request = requests.get('http://127.0.0.1:5000/generate_members?count={}'.format(count))
    if request.status_code == 200:
        print("Generated {} members".format(count))
    else:
        print("Members generation failed: {}".format(request.status_code))


accuracies = []
stages = [20, 100, 1000, 5000, 10000]


def run_stage(stage_count):
    reset_db()
    generate_teams()
    generate_members(stage_count)
    stage_accuracy = get_current_accuracy()
    accuracies.append(stage_accuracy)
    print("Accuracy: {}%".format(stage_accuracy * 100))
    print('------------------------------')


reset_db()
generate_ground_truth()
print("Ground truth generated")
ground_truth_accuracy = get_current_accuracy()
accuracies.append(ground_truth_accuracy)
print("Ground truth accuracy: {}%".format(get_current_accuracy() * 100))
print('------------------------------')

for stage in stages:
    run_stage(stage)

headers = ['Ground truth']
for stage in stages:
    headers.append('{} members'.format(stage))

row = ["{:.2f}%".format(ground_truth_accuracy * 100)]
for i in range(1, len(accuracies)):
    row.append("{:.2f}%".format((accuracies[i]) * 100))

x = PrettyTable(headers)
x.add_row(row)
print(x)
