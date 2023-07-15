"use client";
import React, { Fragment } from "react";
import { RequiredMember, Team } from "@/app/matchingTypes";
import { v4 as uuidv4 } from "uuid";
import Button from "@/app/components/button";
import { useTeams } from "@/app/states/teamsStates";

const TeamEditModal = () => {
  const {
    teamToEdit,
    closeEditModal,
    editTeam,
    addTeam,
    isModalOpen,
    deleteTeam,
  } = useTeams((state) => ({
    teamToEdit: state.teamToEdit,
    isModalOpen: state.isModalOpen,
    closeEditModal: state.closeEditModal,
    editTeam: state.editTeam,
    addTeam: state.addTeam,
    deleteTeam: state.deleteTeam,
  }));

  const [team, setTeam] = React.useState<Team>();
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (teamToEdit) {
      setTeam(teamToEdit);
    }
  }, [teamToEdit]);

  const updateTeam = (team: Partial<Team>) => {
    setTeam((prev) => ({ ...prev, ...(team as Team) }));
  };

  const updateMember = (
    id: number | string,
    member: Partial<RequiredMember>,
  ) => {
    const members = team?.required_members;
    if (members) {
      const index = members.findIndex((member) => member.id === id);
      if (index !== -1) {
        members[index] = { ...members[index], ...(member as RequiredMember) };
        updateTeam({ required_members: members });
      }
    }
  };

  const addMember = () => {
    const members = team?.required_members;
    if (members) {
      members.push({
        id: uuidv4(),
        count: 1,
        role: "Designer",
        required_skills: [],
        criteria: {
          design: 50,
        },
      });
      updateTeam({ required_members: members });
    }
  };

  const removeMember = (id: number | string) => {
    const members = team?.required_members;
    if (members) {
      const index = members.findIndex((member) => member.id === id);
      if (index !== -1) {
        members.splice(index, 1);
        updateTeam({ required_members: members });
      }
    }
  };

  if (!teamToEdit || !team) {
    return null;
  }

  const patchTeam = async () => {
    setLoading(true);
    if (!teamToEdit?.id) {
      const response = await addTeam({
        ...team,
        id: uuidv4(),
        time_frame: {
          start: "2021-01-01",
          end: "2021-01-01",
        },
      });
      if (response) {
        setLoading(false);
      }
    } else {
      const response = await editTeam(team);
      if (response) {
        setLoading(false);
      }
    }
    closeEditModal();
  };

  return (
    <dialog id="my_modal_2" open={isModalOpen} className="modal">
      <form method="dialog" className="modal-box flex flex-col gap-2">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Team Name</span>
          </label>
          <input
            type="text"
            placeholder="Name"
            className="input input-bordered"
            value={team.name}
            onChange={(e) => updateTeam({ name: e.target.value })}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <input
            type="text"
            placeholder="Description"
            className="input input-bordered"
            value={team.description}
            onChange={(e) => updateTeam({ description: e.target.value })}
          />
        </div>
        <div className="divider" />
        {team?.required_members.map((member, id) => (
          <div key={id}>
            <div className="grid grid-cols-2 gap-2  ">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  value={member.role}
                  onChange={(e) =>
                    updateMember(member.id!, { role: e.target.value })
                  }
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
                  <span className="label-text">Count</span>
                </label>
                <input
                  type="number"
                  placeholder="Count"
                  className="input input-bordered"
                  value={member.count}
                  onChange={(e) =>
                    updateMember(member.id!, {
                      count: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Skills</span>
              </label>
              <input
                type="text"
                placeholder="React, Redux"
                className="input input-bordered"
                defaultValue={member.required_skills.join(",")}
                onBlur={(e) =>
                  updateMember(member.id!, {
                    required_skills: e.target.value.split(","),
                  })
                }
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
                        if (
                          e.target.textContent &&
                          e.target.textContent !== key
                        ) {
                          console.log(e.target.textContent);
                          criteriaCopy[e.target.textContent] =
                            criteriaCopy[key];
                          delete criteriaCopy[key];
                        }
                        updateMember(member.id!, {
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
                          updateMember(member.id!, {
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
                        updateMember(member.id!, {
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
                    updateMember(member.id!, {
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
            <div className="divider" />
          </div>
        ))}
        <Button
          className="btn btn-primary"
          onClick={(e) => {
            e.preventDefault();
            addMember();
          }}
        >
          Add Member
        </Button>
        <div className="pt-4 flex gap-2 justify-end">
          <Button
            className="btn btn-primary"
            onClick={patchTeam}
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
          {teamToEdit?.id && (
            <Button
              className="btn btn-error"
              onClick={() => {
                void deleteTeam(teamToEdit);
                closeEditModal();
              }}
            >
              Delete Team
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

export default TeamEditModal;
