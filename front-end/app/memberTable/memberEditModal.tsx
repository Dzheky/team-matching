"use client";
import React, { Fragment } from "react";
import { useMembers } from "@/app/states/membersStates";
import Avatar from "boring-avatars";
import { avatarColors, roleToAvatarStyle } from "@/app/theme";
import { Member } from "@/app/matchingTypes";
import { v4 as uuidv4 } from "uuid";
import Button from "@/app/components/button";

const MemberEditModal = () => {
  const { memberToEdit, closeEditModal, editMember, addMember, deleteMember } =
    useMembers((state) => ({
      memberToEdit: state.memberToEdit,
      closeEditModal: state.closeEditModal,
      editMember: state.editMember,
      addMember: state.addMember,
      deleteMember: state.deleteMember,
    }));

  const [member, setMember] = React.useState<Member>();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [skills, setSkills] = React.useState<string>("");

  React.useEffect(() => {
    if (memberToEdit) {
      setMember(memberToEdit);
      setSkills(memberToEdit.skills.join(", "));
    }
  }, [memberToEdit]);

  const updateMember = (member: Partial<Member>) => {
    setMember((prev) => ({ ...prev, ...(member as Member) }));
  };

  if (!memberToEdit || !member) {
    return null;
  }

  const patchMember = async () => {
    setLoading(true);
    console.log(member);
    if (!memberToEdit?.id) {
      const response = await addMember({
        ...member,
        id: uuidv4(),
      });
      if (response) {
        setLoading(false);
      }
    } else {
      const response = await editMember(member);
      if (response) {
        setLoading(false);
      }
    }
    closeEditModal();
  };

  return (
    <dialog id="my_modal_2" open={!!memberToEdit} className="modal">
      <form method="dialog" className="modal-box flex flex-col gap-2">
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <Avatar
              size={62}
              name={member.name}
              variant={roleToAvatarStyle[member.role]}
              colors={avatarColors}
            />
          </div>
          <div>
            <div className="font-bold text-lg">{member.name}</div>
            <div className="text-md opacity-50">{member.role}</div>
          </div>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Name</span>
          </label>
          <input
            type="text"
            placeholder="Name"
            className="input input-bordered"
            onChange={(e) => updateMember({ name: e.target.value })}
            value={member.name}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Role</span>
          </label>
          <select
            value={member.role}
            onChange={(e) => updateMember({ role: e.target.value })}
            className="select select-bordered w-full"
          >
            <option>Designer</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>QA</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Skills</span>
          </label>
          <input
            type="text"
            placeholder="Name"
            className="input input-bordered"
            value={skills}
            onBlur={() => {
              updateMember({
                skills: skills.replace(/\s/g, "").split(","),
              });
            }}
            onChange={(e) => {
              setSkills(e.target.value);
            }}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Criteria</span>
          </label>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "auto auto  1fr",
            }}
          >
            {Object.keys(member.criteria).map((key) => (
              <Fragment key={key}>
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="text-sm opacity-50"
                  defaultValue={key}
                  onBlur={(e) => {
                    const criteriaCopy = { ...member.criteria };
                    if (e.target.textContent && e.target.textContent !== key) {
                      console.log(e.target.textContent);
                      criteriaCopy[e.target.textContent] = criteriaCopy[key];
                      delete criteriaCopy[key];
                    }
                    updateMember({
                      criteria: criteriaCopy,
                    });
                  }}
                >
                  {key}
                </span>
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input input-xs input-bordered w-20"
                    value={member.criteria[key]}
                    onChange={(e) =>
                      updateMember({
                        criteria: {
                          ...member.criteria,
                          [key]: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max="100"
                  value={member.criteria[key]}
                  onChange={(e) => {
                    updateMember({
                      criteria: {
                        ...member.criteria,
                        [key]: parseInt(e.target.value),
                      },
                    });
                  }}
                  className="range range-xs"
                />
              </Fragment>
            ))}
            <Button
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                updateMember({
                  criteria: {
                    ...member.criteria,
                    "New Criteria": 0,
                  },
                });
              }}
            >
              Add Criteria
            </Button>
          </div>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button
            className="btn btn-primary"
            onClick={patchMember}
            loading={loading}
          >
            Save
          </Button>
          <Button
            className="btn btn-error"
            onClick={() => {
              closeEditModal();
            }}
          >
            Cancel
          </Button>
          {memberToEdit?.id && (
            <Button
              className="btn btn-error"
              onClick={() => {
                void deleteMember(memberToEdit);
                closeEditModal();
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
      <form method="dialog" className="modal-backdrop bg-neutral opacity-30">
        <button onClick={closeEditModal}>close</button>
      </form>
    </dialog>
  );
};

export default MemberEditModal;
