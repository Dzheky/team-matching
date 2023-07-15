"use client";
import React from "react";
import { RequiredMember } from "@/app/matchingTypes";
import { Fragment } from "react";


interface RequiredMemberTableProps {
  members: RequiredMember[];
}

const RequiredMembers = ({ members }: RequiredMemberTableProps) => {
  return (
    <div>
      {members.map((member, index) => (
        <div key={member.id} className="flex flex-col">
          <div className="text-lg font-semibold pb-2">
            {member.role}
            <span className="text-sm text-gray-400">
              {" "}
              (count: {member.count})
            </span>
          </div>
          <div className="flex flex-col gap-2 pb-4">
            <div className="text-sm font-semibold">Skills</div>
            <div className="flex gap-2">
              {member.required_skills.map((skill) => (
                <span key={skill} className="badge badge-secondary badge-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Criteria</div>
            <div
              className="grid items-center gap-x-3"
              style={{
                gridTemplateColumns: "auto auto 1fr",
              }}
            >
              {Object.keys(member.criteria).map((key) => {
                return (
                  <Fragment key={key}>
                    <span className="text-sm opacity-80 capitalize">{key}</span>
                    <span className="badge badge-primary badge-sm">
                      {member.criteria[key]}
                    </span>
                    <progress
                      className="progress progress-accent"
                      value={member.criteria[key]}
                      max="100"
                    ></progress>
                  </Fragment>
                );
              })}
            </div>
          </div>
          {index !== members.length - 1 && <div className="divider"></div>}
        </div>
      ))}
    </div>
  );
};

export default RequiredMembers;
