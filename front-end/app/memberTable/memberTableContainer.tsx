"use client";
import React from "react";
import { useMembers } from "@/app/states/membersStates";
import MemberTable from "@/app/memberTable/memberTable";

const MemberTableContainer = () => {
  const { members, isLoading, setMembers, setIsLoading, fetchMembers } =
    useMembers((state) => ({
      members: state.members,
      isLoading: state.isLoading,
      setMembers: state.setMembers,
      setIsLoading: state.setIsLoading,
      fetchMembers: state.fetchMembers,
    }));

  React.useEffect(() => {
    if (members.length === 0 && !isLoading) {
      fetchMembers();
    }
  }, [fetchMembers, members.length]);

  if (isLoading) {
    return <span className="loading loading-dots loading-lg"></span>;
  }

  if (members.length === 0) {
    return <span>No members found</span>;
  }

  return (
    <div className="card bg-base-100 p-2">
      <MemberTable members={members} />
    </div>
  );
};

export default MemberTableContainer;
