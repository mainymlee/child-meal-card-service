"use client";

import { useState } from "react";
import { FAMILY_TYPES, SCHOOL_LEVELS } from "@/lib/persona";
import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { setProfile, useProfile } from "@/lib/hooks/useProfile";
import type { FamilyType, SchoolLevel } from "@/lib/types";

export function ProfileSheet() {
  const profile = useProfile();
  const { close } = useSheet();
  const { show } = useToast();
  const [familyType, setFamilyType] = useState<FamilyType>(profile.familyType);
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(profile.schoolLevel);

  const save = () => {
    setProfile({ familyType, schoolLevel });
    close();
    show("저장했어요. 조건에 맞는 혜택으로 다시 찾았어요");
  };

  return (
    <>
      <h3>내 조건 수정</h3>
      <p className="desc">혜택 찾기에만 쓰고, 다른 곳에는 쓰지 않아요.</p>
      <p className="lbl">가구 상황</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {FAMILY_TYPES.map((f) => (
          <button
            key={f}
            className={`chip${f === familyType ? " on" : ""}`}
            onClick={() => setFamilyType(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="lbl">학교</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {SCHOOL_LEVELS.map((s) => (
          <button
            key={s}
            className={`chip${s === schoolLevel ? " on" : ""}`}
            onClick={() => setSchoolLevel(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <button className="btn" onClick={save}>
        저장하기
      </button>
    </>
  );
}
