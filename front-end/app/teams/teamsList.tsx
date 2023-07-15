"use client";
import React, { useEffect } from "react";
import { useTeams } from "@/app/states/teamsStates";
import { Member, Team } from "@/app/matchingTypes";
import MemberTable from "@/app/memberTable/memberTable";
import RequiredMembers from "@/app/memberTable/requiredMembers";

const TeamsList = () => {
  const { teams, isLoading, fetchTeams } = useTeams((state) => ({
    teams: state.teams,
    isLoading: state.isLoading,
    fetchTeams: state.fetchTeams,
  }));

  const editTeam = (team: Team) => {
    useTeams.setState({ teamToEdit: team, isModalOpen: true });
  };

  useEffect(() => {
    if (teams.length === 0) {
      fetchTeams();
    }
  }, [fetchTeams, teams.length]);

  const renderMembers = (members: Member[]) => {
    return (
      <div className="flex flex-col gap-4 pt-4">
        <div className="text-md font-bold">Members:</div>
        <MemberTable members={members} />
      </div>
    );
  };

  if (isLoading) {
    return <span className="loading loading-dots loading-lg"></span>;
  }

  if (teams.length === 0) {
    return <span>No teams found</span>;
  }

  return (
    <div className="flex flex-col gap-8">
      {teams.map((team) => (
        <div
          key={team.id}
          className="card bg-base-100 shadow-lg cursor-pointer"
          onClick={() => {
            editTeam(team);
          }}
        >
          <div className="card-body">
            <div className="card-title">{team.name}</div>
            <div>{team.description}</div>
            <div className="text-xl font-semibold pt-4">Required Members:</div>
            <div>
              <RequiredMembers members={team.required_members} />
            </div>
            {team?.members?.length > 0 && renderMembers(team.members)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamsList;
