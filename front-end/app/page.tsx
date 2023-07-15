"use client";
import Button from "@/app/components/button";
import { setNotifications } from "@/app/components/notifications";
import React from "react";
import { useMainPageLoading } from "@/app/states/mainPageLoadingStates";
import TeamsList from "@/app/teams/teamsList";
import { useTeams } from "@/app/states/teamsStates";
import { useMembers } from "@/app/states/membersStates";
import MemberTableContainer from "@/app/memberTable/memberTableContainer";
import { MatchingResult, Member, Team } from "@/app/matchingTypes";

export default function Home() {
  const { fetchTeams, teamsCount, addMembers } = useTeams((state) => ({
    fetchTeams: state.fetchTeams,
    teamsCount: state.teams.length,
    addMembers: state.addMembers,
  }));
  const { fetchMembers, membersCount } = useMembers((state) => ({
    fetchMembers: state.fetchMembers,
    membersCount: state.members.length,
    addMember: state.addMember,
  }));

  const fetchAll = () => {
    fetchTeams();
    fetchMembers();
  };

  const { generateTeams, generateMembers, resetAll, matchingTeams } =
    useMainPageLoading((state) => ({
      generateMembers: state.generateMembers,
      generateTeams: state.generateTeams,
      resetAll: state.resetAll,
      matchingTeams: state.matchingTeams,
    }));

  const handleResetAll = () => {
    useMainPageLoading.setState({ resetAll: true });
    fetch("http://127.0.0.1:5000/reset").then(() => {
      useMainPageLoading.setState({ resetAll: false });
      fetchAll();
      setNotifications("success", "All data reset successfully");
    });
  };

  const handleAddMemberClick = () => {
    const newMember: Member = {
      name: "John Smith",
      role: "Designer",
      skills: ["Figma", "Adobe XD", "Adobe Photoshop"],
      criteria: {
        design: 50,
      },
    };

    useMembers.setState({ memberToEdit: newMember });
  };

  const handleAddTeamClick = () => {
    const newTeam: Team = {
      members: [],
      description: "Description",
      name: "Team 1",
      required_members: [
        {
          role: "Designer",
          count: 1,
          required_skills: ["Figma", "Adobe XD", "Adobe Photoshop"],
          criteria: {
            design: 50,
          },
        },
      ],
    };

    useTeams.setState({ teamToEdit: newTeam, isModalOpen: true });
  };

  const handleGenerateMembers = () => {
    useMainPageLoading.setState({ generateMembers: true });
    fetch("http://127.0.0.1:5000/generate_members?count=1000").then(() => {
      useMainPageLoading.setState({ generateMembers: false });
      fetchMembers();
      setNotifications("success", "Members generated successfully");
    });
  };

  const handleGenerateTeams = () => {
    useMainPageLoading.setState({ generateTeams: true });
    fetch("http://127.0.0.1:5000/generate_teams").then(() => {
      useMainPageLoading.setState({ generateTeams: false });
      fetchTeams();
      setNotifications("success", "Teams generated successfully");
    });
  };

  const handleMatchTeams = () => {
    useMainPageLoading.setState({ matchingTeams: true });
    fetch("http://127.0.0.1:5000/match")
      .then((res) => res.json())
      .then((teamWithMembers: MatchingResult) => {
        useMainPageLoading.setState({ matchingTeams: false });
        for (const teamId in teamWithMembers.teams) {
          const newMembers = [];
          for (const role in teamWithMembers.teams[teamId]) {
            for (const member of teamWithMembers.teams[teamId][role]) {
              newMembers.push(member);
            }
          }

          addMembers(teamId, newMembers);
        }
        setNotifications("success", "Teams matched successfully");
      });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="container mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl">Controls</h1>
          <div className="flex gap-4">
            <Button
              className="btn-error"
              loading={resetAll}
              onClick={handleResetAll}
            >
              Reset All
            </Button>
            <Button
              className="btn-neutral"
              loading={generateMembers}
              onClick={handleAddTeamClick}
            >
              Add Team
            </Button>
            <Button
              className="btn-neutral"
              loading={generateTeams}
              onClick={handleAddMemberClick}
            >
              Add Member
            </Button>
            <Button
              className="btn-primary"
              loading={matchingTeams}
              onClick={handleMatchTeams}
            >
              Match Teams
            </Button>
          </div>
        </div>
        <div className="flex gap-8 pb-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl">Teams {teamsCount}:</h1>
            <TeamsList />
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl">Members {membersCount}:</h1>
            <div className="overflow-x-auto">
              <MemberTableContainer />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
