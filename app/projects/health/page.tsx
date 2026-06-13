import type { Metadata } from "next";
import ProjectPage from "@/components/ProjectPage";
import { PROJECTS } from "@/lib/content";

const project = PROJECTS.find((p) => p.slug === "health")!;
export const metadata: Metadata = { title: project.name, description: project.intro };
export default function Page() { return <ProjectPage project={project} />; }
