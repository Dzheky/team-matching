"use client";
import React from "react";
import MemberRow from "@/app/memberTable/memberRow";
import { Member } from "@/app/matchingTypes";
import MemberEditModal from "@/app/memberTable/memberEditModal";

interface MemberTableProps {
  members: Member[];
}

const MemberTable = ({ members }: MemberTableProps) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Skills</th>
          <th>Criteria</th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <MemberRow key={member.id} member={member} />
        ))}
      </tbody>
    </table>
  );
};

export default MemberTable;
