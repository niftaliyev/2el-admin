"use client";
import React from "react";
import ComponentCard from "../../common/ComponentCard";
import Switch from "../switch/Switch";

export default function ToggleSwitch() {
  const handleSwitchChange = (checked: boolean) => {
    console.log("Switch is now:", checked ? "ON" : "OFF");
  };
  return (
    <ComponentCard title="Dəyişdirici daxiletmə">
      <div className="flex gap-4">
        <Switch
          label="Standart"
          defaultChecked={true}
          onChange={handleSwitchChange}
        />
        <Switch
          label="Seçilmiş"
          defaultChecked={true}
          onChange={handleSwitchChange}
        />
        <Switch label="Deaktiv" disabled={true} />
      </div>{" "}
      <div className="flex gap-4">
        <Switch
          label="Standart"
          defaultChecked={true}
          onChange={handleSwitchChange}
          color="gray"
        />
        <Switch
          label="Seçilmiş"
          defaultChecked={true}
          onChange={handleSwitchChange}
          color="gray"
        />
        <Switch label="Deaktiv" disabled={true} color="gray" />
      </div>
    </ComponentCard>
  );
}
