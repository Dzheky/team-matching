import React from "react";
import Avatar from "boring-avatars";
import { avatarColors, roleToAvatarStyle } from "@/app/theme";
import { Member } from "@/app/matchingTypes";
import { useMembers } from "@/app/states/membersStates";

interface MemberRowProps {
  member: Member;
}

const MemberRow = ({ member }: MemberRowProps) => {
  const { openEditModal } = useMembers((state) => ({
    openEditModal: state.openEditModal,
  }));

  return (
    <tr className="hover cursor-pointer" onClick={() => openEditModal(member)}>
      <td>
        <div className="flex items-center space-x-3 items-center">
          <div className="avatar">
            <Avatar
              size={38}
              name={member.name}
              variant={roleToAvatarStyle[member.role]}
              colors={avatarColors}
            />
          </div>
          <div>
            <div className="font-bold">{member.name}</div>
            <div className="text-sm opacity-50">{member.role}</div>
          </div>
        </div>
      </td>
      <td>
        <div className="flex gap-1">
          {member.skills.map((skill) => (
            <span key={skill} className="badge badge-secondary badge-sm">
              {skill}
            </span>
          ))}
        </div>
      </td>
      <td>
        {Object.keys(member.criteria).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-sm opacity-50">{key}</span>
            <span className="badge badge-primary badge-sm">
              {member.criteria[key]}
            </span>
          </div>
        ))}
      </td>
    </tr>
  );
};

export default MemberRow;
