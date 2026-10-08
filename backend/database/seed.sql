-- ============================================================================
-- SMARTPLACIFY — DEVELOPMENT & DEMO SEED DATA
-- Default password for all demo accounts: password123
-- Bcrypt Hash: $2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2
-- ============================================================================

-- Clean existing data in reverse dependency order
TRUNCATE TABLE audit_logs, notifications, placements, placement_drives, 
interviews, application_status_history, applications, job_skills, jobs, 
resumes, certifications, student_projects, student_skills, skills, 
academic_records, admins, placement_officers, recruiters, students, 
companies, courses, departments, users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DEPARTMENTS
-- ----------------------------------------------------------------------------
INSERT INTO departments (id, department_name, department_code, description) VALUES
('d1000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering'),
('d1000000-0000-0000-0000-000000000002', 'Information Technology', 'IT', 'Department of Information Technology'),
('d1000000-0000-0000-0000-000000000003', 'Electronics & Communication Engineering', 'ECE', 'Department of Electronics and Communication');

-- ----------------------------------------------------------------------------
-- 2. COURSES
-- ----------------------------------------------------------------------------
INSERT INTO courses (id, department_id, course_name, course_code, duration) VALUES
('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'B.Tech Computer Science & Engineering', 'CSE-BTECH', '4 Years'),
('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'B.Tech Information Technology', 'IT-BTECH', '4 Years'),
('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'B.Tech Electronics & Communication', 'ECE-BTECH', '4 Years');

-- ----------------------------------------------------------------------------
-- 3. SKILLS
-- ----------------------------------------------------------------------------
INSERT INTO skills (id, skill_name, skill_category) VALUES
('e1000000-0000-0000-0000-000000000001', 'React.js', 'Frontend Development'),
('e1000000-0000-0000-0000-000000000002', 'Node.js', 'Backend Development'),
('e1000000-0000-0000-0000-000000000003', 'PostgreSQL', 'Databases'),
('e1000000-0000-0000-0000-000000000004', 'Python', 'Programming Languages'),
('e1000000-0000-0000-0000-000000000005', 'AWS Cloud', 'Cloud Infrastructure'),
('e1000000-0000-0000-0000-000000000006', 'Data Structures & Algorithms', 'Computer Science Fundamentals'),
('e1000000-0000-0000-0000-000000000007', 'Git & GitHub', 'Developer Tools'),
('e1000000-0000-0000-0000-000000000008', 'Docker', 'DevOps & Containers');

-- ----------------------------------------------------------------------------
-- 4. COMPANIES
-- ----------------------------------------------------------------------------
INSERT INTO companies (id, company_name, industry, description, website, email, phone, location, company_size, logo_url, status) VALUES
('11111111-1111-1111-1111-111111111111', 'TechCorp Solutions', 'Software & Cloud Services', 'Leading enterprise technology solutions and cloud engineering provider.', 'https://techcorp.example.com', 'careers@techcorp.example.com', '+91 80 4000 1100', 'Bengaluru, Karnataka, India', '1000-5000', 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 5. USERS
-- Demo users with bcrypt hashed passwords ('password123')
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, phone, status) VALUES
-- Demo Student 1 (Spec standard)
('a0000000-0000-0000-0000-000000000001', 'Demo Student', 'student.demo@smartplacify.edu', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'STUDENT', '+91 98765 43210', 'ACTIVE'),
-- Demo Student 2 (Frontend UI default)
('a0000000-0000-0000-0000-000000000002', 'Rahul Kumar', 'rahul.kumar@university.edu.in', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'STUDENT', '+91 98765 00001', 'ACTIVE'),
-- Demo Recruiter 1 (Spec standard)
('b0000000-0000-0000-0000-000000000001', 'Demo Recruiter', 'recruiter.demo@smartplacify.edu', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'RECRUITER', '+91 98111 22334', 'ACTIVE'),
-- Demo Recruiter 2 (Frontend UI default)
('b0000000-0000-0000-0000-000000000002', 'Priya Sharma', 'priya.sharma@techcorp.com', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'RECRUITER', '+91 98222 33445', 'ACTIVE'),
-- Demo Placement Officer 1 (Spec standard)
('c0000000-0000-0000-0000-000000000001', 'Demo Placement Officer', 'officer.demo@smartplacify.edu', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'PLACEMENT_OFFICER', '+91 94000 11223', 'ACTIVE'),
-- Demo Placement Officer 2 (Frontend UI default)
('c0000000-0000-0000-0000-000000000002', 'Dr. Aris V. Nair', 'placement.head@university.edu.in', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'PLACEMENT_OFFICER', '+91 94444 55667', 'ACTIVE'),
-- Demo Admin 1 (Spec standard)
('d0000000-0000-0000-0000-000000000001', 'Demo Administrator', 'admin.demo@smartplacify.edu', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'ADMIN', '+91 90000 00001', 'ACTIVE'),
-- Demo Admin 2 (Frontend UI default)
('d0000000-0000-0000-0000-000000000002', 'Admin System', 'admin@smartplacify.edu.in', '$2a$10$FmYlh8s/XNKNlcssq.5N4.JA3Pb4u4z5Rst7GlR./PjkstjunbSP2', 'ADMIN', '+91 90000 00002', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 6. STUDENTS
-- ----------------------------------------------------------------------------
INSERT INTO students (id, user_id, student_id, roll_number, department_id, course_id, date_of_birth, gender, graduation_year, cgpa, phone, address, profile_image) VALUES
('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'STU2026-001', 'CS2026-001', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '2003-08-15', 'Male', 2026, 8.75, '+91 98765 43210', 'Technical Campus Hostel, Bengaluru', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'STU2022-045', 'CS2022045', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '2003-10-14', 'Male', 2026, 8.74, '+91 98765 00001', 'B-402, Green Park Avenue, Bengaluru', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

-- ----------------------------------------------------------------------------
-- 7. RECRUITERS
-- ----------------------------------------------------------------------------
INSERT INTO recruiters (id, user_id, company_id, designation, recruiter_code) VALUES
('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Senior Talent Lead', 'REC-TECH-001'),
('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Senior Talent Acquisition Lead', 'REC-TECH-002');

-- ----------------------------------------------------------------------------
-- 8. PLACEMENT_OFFICERS
-- ----------------------------------------------------------------------------
INSERT INTO placement_officers (id, user_id, employee_id, department_id, designation) VALUES
('c1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'TPO-2026-01', 'd1000000-0000-0000-0000-000000000001', 'Head of Training & Placement'),
('c1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'TPO-2026-02', 'd1000000-0000-0000-0000-000000000001', 'Head of Training & Placement');

-- ----------------------------------------------------------------------------
-- 9. ADMINS
-- ----------------------------------------------------------------------------
INSERT INTO admins (id, user_id) VALUES
('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002');

-- ----------------------------------------------------------------------------
-- 10. ACADEMIC_RECORDS
-- ----------------------------------------------------------------------------
INSERT INTO academic_records (student_id, semester, academic_year, cgpa, percentage, backlogs) VALUES
('a1000000-0000-0000-0000-000000000001', 'Semester 1', '2022-2023', 8.20, 82.00, 0),
('a1000000-0000-0000-0000-000000000001', 'Semester 2', '2022-2023', 8.45, 84.50, 0),
('a1000000-0000-0000-0000-000000000001', 'Semester 3', '2023-2024', 8.60, 86.00, 0),
('a1000000-0000-0000-0000-000000000001', 'Semester 4', '2023-2024', 8.72, 87.20, 0),
('a1000000-0000-0000-0000-000000000001', 'Semester 5', '2024-2025', 8.85, 88.50, 0),
('a1000000-0000-0000-0000-000000000001', 'Semester 6', '2024-2025', 8.90, 89.00, 0);

-- ----------------------------------------------------------------------------
-- 11. STUDENT_SKILLS
-- ----------------------------------------------------------------------------
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'ADVANCED'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'INTERMEDIATE'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'INTERMEDIATE'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', 'INTERMEDIATE'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000006', 'ADVANCED'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000007', 'ADVANCED');

-- ----------------------------------------------------------------------------
-- 12. STUDENT_PROJECTS
-- ----------------------------------------------------------------------------
INSERT INTO student_projects (student_id, project_title, description, technologies, github_url, live_url, start_date, end_date) VALUES
('a1000000-0000-0000-0000-000000000001', 'Smart Campus Placement Portal', 'Placement management platform with real-time job eligibility matching and tracking algorithms.', 'React, Node.js, PostgreSQL, Tailwind CSS', 'https://github.com/example/smart-placement', 'https://smartplacify.demo.app', '2025-01-10', '2025-05-30'),
('a1000000-0000-0000-0000-000000000001', 'AI-Powered Resume ATS Analyzer', 'NLP tool calculating match score between resumes and job requirements.', 'Python, FastAPI, React, SpaCy', 'https://github.com/example/resume-ats-analyzer', 'https://ats-analyzer.demo.app', '2024-09-01', '2024-12-15');

-- ----------------------------------------------------------------------------
-- 13. CERTIFICATIONS
-- ----------------------------------------------------------------------------
INSERT INTO certifications (student_id, certification_name, issuing_organization, issue_date, expiry_date, credential_id, credential_url) VALUES
('a1000000-0000-0000-0000-000000000001', 'AWS Certified Cloud Practitioner', 'Amazon Web Services', '2024-08-01', '2027-08-01', 'AWS-9923847291', 'https://aws.amazon.com/verification'),
('a1000000-0000-0000-0000-000000000001', 'Meta Front-End Developer Specialization', 'Coursera / Meta', '2024-05-01', NULL, 'META-FE-8819203', 'https://coursera.org/verify/META-FE');

-- ----------------------------------------------------------------------------
-- 14. RESUMES
-- ----------------------------------------------------------------------------
INSERT INTO resumes (id, student_id, file_name, file_url, is_active) VALUES
('e2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Demo_Student_Resume_2026.pdf', 'https://storage.smartplacify.edu/resumes/demo_resume.pdf', TRUE);

-- ----------------------------------------------------------------------------
-- 15. JOBS
-- ----------------------------------------------------------------------------
INSERT INTO jobs (id, company_id, recruiter_id, job_title, job_description, job_type, location, work_mode, salary_min, salary_max, experience_required, minimum_cgpa, graduation_year, application_deadline, status) VALUES
('e3000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'b1000000-0000-0000-0000-000000000001', 'Software Engineer - Full Stack', 'Seeking Full Stack Engineers proficient in modern JavaScript, React, Node.js, and relational database systems.', 'FULL_TIME', 'Bengaluru, Karnataka, India', 'HYBRID', 1450000.00, 1800000.00, 'Fresh Graduate', 7.50, 2026, '2026-11-30', 'OPEN'),
('e3000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'b1000000-0000-0000-0000-000000000001', 'Associate Cloud Infrastructure Engineer', 'Design, configure, and maintain resilient cloud infrastructure on AWS using modern DevOps automation.', 'FULL_TIME', 'Bengaluru / Pune', 'HYBRID', 1200000.00, 1500000.00, 'Fresh Graduate', 7.00, 2026, '2026-12-15', 'OPEN');

-- ----------------------------------------------------------------------------
-- 16. JOB_SKILLS
-- ----------------------------------------------------------------------------
INSERT INTO job_skills (job_id, skill_id, is_required) VALUES
('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', TRUE),
('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', TRUE),
('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', TRUE),
('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000006', TRUE),
('e3000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000005', TRUE),
('e3000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000008', TRUE);

-- ----------------------------------------------------------------------------
-- 17. APPLICATIONS
-- ----------------------------------------------------------------------------
INSERT INTO applications (id, job_id, student_id, resume_id, cover_letter, status) VALUES
('e4000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 'Eager to apply my hands-on full stack skills to TechCorp Solutions enterprise systems.', 'SHORTLISTED');

-- ----------------------------------------------------------------------------
-- 18. APPLICATION_STATUS_HISTORY
-- ----------------------------------------------------------------------------
INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, remarks) VALUES
('e4000000-0000-0000-0000-000000000001', NULL, 'APPLIED', 'a0000000-0000-0000-0000-000000000001', 'Application submitted by candidate'),
('e4000000-0000-0000-0000-000000000001', 'APPLIED', 'SCREENING', 'b0000000-0000-0000-0000-000000000001', 'Candidate resume cleared automated criteria'),
('e4000000-0000-0000-0000-000000000001', 'SCREENING', 'SHORTLISTED', 'b0000000-0000-0000-0000-000000000001', 'Shortlisted for technical evaluation');

-- ----------------------------------------------------------------------------
-- 19. INTERVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO interviews (id, application_id, interviewer_id, interview_type, interview_date, start_time, end_time, meeting_link, location, status, feedback) VALUES
('e5000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'TECHNICAL', '2026-11-15', '10:30:00', '11:30:00', 'https://meet.google.com/abc-demo-int', 'Virtual Google Meet', 'SCHEDULED', 'Review core data structures, React state, and project portfolio architecture.');

-- ----------------------------------------------------------------------------
-- 20. PLACEMENT_DRIVES
-- ----------------------------------------------------------------------------
INSERT INTO placement_drives (id, company_id, created_by, drive_title, description, start_date, end_date, eligibility_criteria, status) VALUES
('e6000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001', 'TechCorp Solutions Annual Campus Hiring 2026', 'On-campus placement drive for 2026 graduating batch across Software and Cloud Engineering streams.', '2026-11-10', '2026-11-20', 'Minimum CGPA >= 7.50, 0 Active Backlogs, CSE/IT/ECE Branches', 'UPCOMING');

-- ----------------------------------------------------------------------------
-- 21. PLACEMENTS
-- ----------------------------------------------------------------------------
INSERT INTO placements (id, student_id, company_id, job_id, application_id, package, placement_date, joining_date, status, offer_details) VALUES
('e7000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e3000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', '16.0 LPA', CURRENT_DATE, '2026-07-01', 'OFFERED', 'Full-time Software Engineer placement offer with base salary, joining bonus, and performance incentives.');

-- ----------------------------------------------------------------------------
-- 22. NOTIFICATIONS
-- ----------------------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, notification_type, is_read) VALUES
('a0000000-0000-0000-0000-000000000001', 'Interview Scheduled', 'Your Technical Round interview with TechCorp Solutions is scheduled for 15 Nov 2026 at 10:30 AM.', 'INTERVIEW', FALSE),
('a0000000-0000-0000-0000-000000000001', 'Application Shortlisted', 'Congratulations! Your application for Software Engineer at TechCorp Solutions has been shortlisted.', 'APPLICATION', FALSE),
('a0000000-0000-0000-0000-000000000001', 'New Placement Drive Announced', 'TechCorp Solutions announced Annual Campus Hiring 2026.', 'DRIVE', TRUE);

-- ----------------------------------------------------------------------------
-- 23. AUDIT_LOGS
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES
('d0000000-0000-0000-0000-000000000001', 'INITIALIZE_SCHEMA', 'SYSTEM', 'DATABASE', 'SmartPlacify database schema and demo seed initialized.', '127.0.0.1');
