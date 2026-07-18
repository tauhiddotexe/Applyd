from typing import TypedDict, NotRequired


class ResumeContact(TypedDict, total=False):
    name: str
    email: str
    phone: str
    location: str
    linkedin: str
    website: str


class ResumeExperience(TypedDict, total=False):
    job_title: str
    company: str
    location: str
    start_date: str
    end_date: str
    bullets: list[str]


class ResumeEducation(TypedDict, total=False):
    degree: str
    school: str
    location: str
    start_date: str
    end_date: str
    gpa: str


class ResumeProject(TypedDict, total=False):
    name: str
    description: str
    bullets: list[str]


class StructuredResume(TypedDict, total=False):
    contact: ResumeContact
    summary: str
    experiences: list[ResumeExperience]
    education: list[ResumeEducation]
    skills: list[str]
    projects: list[ResumeProject]
    certifications: list[str]
    languages: list[str]
