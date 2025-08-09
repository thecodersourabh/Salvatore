import { Outlet } from "react-router-dom";

export const ProfileLayout = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow min-h-[calc(100vh-4rem)]">
        <Outlet />
      </div>
    </div>
  );
};
