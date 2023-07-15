import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import cn from "classnames";
import React from "react";
import Notifications from "@/app/components/notifications";
import MemberEditModal from "@/app/memberTable/memberEditModal";
import TeamEditModal from "@/app/teams/teamEditModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "bg-base-200 text-base-content")}>
        <div className="navbar bg-base-100 sticky flex items-center justify-between top-0 z-10 border-b-base-200 border-b-2">
          <a className="btn btn-ghost normal-case text-xl">TeamMatch</a>
        </div>
        <div className="container mx-auto p-4">{children}</div>
        <Notifications />
        <MemberEditModal />
        <TeamEditModal />
      </body>
    </html>
  );
}
