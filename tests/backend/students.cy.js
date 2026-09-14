// Students API e2e test.
//
// Students endpoints (routes registered in sudents-router.js, mounted at
// /api/v1/students behind authenticateToken + csrfProtection):
//   GET  /students             list (supports ?name/class/section/roll filters)
//   POST /students             add student
//   GET  /students/:id         detail
//   POST /students/:id/status  toggle system access { status }
//   PUT  /students/:id         update student
// There is NO DELETE /students route.
//
// Notes on behaviour:
//   * POST /students adds the user and then tries to send a verification
//     email; with the placeholder RESEND key the email fails, which is
//     reported gracefully as "Student added, but failed to send
//     verification email." with status 200.
//   * user_profiles.class_name / section_name have FK constraints to
//     classes(name) / sections(name), so an add/update with a class that
//     doesn't exist fails 500 "Unable to add student". Tests use a class
//     created on the fly.

const ADMIN_EMAIL = "admin@school-admin.com";
const ADMIN_PASSWORD = "3OU4zn3q6Zh9";

describe("Students API", () => {
  let csrf = null;

  const uid = () => Date.now().toString().slice(-9);

  const api = (method, url, body) =>
    cy.request({
      method,
      url,
      body,
      failOnStatusCode: false,
      headers: { "x-csrf-token": csrf },
    });

  const setAuthCookies = (subject) => {
    const setCookie = subject.headers["set-cookie"] || [];
    setCookie.forEach((entry) => {
      const pair = entry.split(";")[0];
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const cookies = { secure: false, sameSite: "lax" };
      if (name === "accessToken" || name === "refreshToken") {
        cookies.httpOnly = true;
      }
      cy.setCookie(name, value, cookies);
    });
    return cy.getCookie("csrfToken").then((cookie) => {
      csrf = cookie ? cookie.value : subject.headers["x-csrf-token"];
    });
  };

  const login = () =>
    cy
      .request({
        method: "POST",
        url: "/api/v1/auth/login",
        body: { username: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        failOnStatusCode: false,
      })
      .then((res) => {
        expect(res.status).to.eq(200);
        return setAuthCookies(res).then(() => res);
      });

  const createClass = (name) =>
    api("POST", "/api/v1/classes", { name, sections: null })
      .its("status")
      .should("eq", 200);

  const studentPayload = (name, email, className, sectionName, roll) => ({
    name,
    email,
    gender: "male",
    phone: "1111111111",
    class: className,
    section: sectionName,
    roll,
    admissionDate: "2026-03-01",
    currentAddress: "current addr",
    permanentAddress: "permanent addr",
    fatherName: "Father Test",
    fatherPhone: "111",
    motherName: "Mother Test",
    motherPhone: "222",
    guardianName: "Guardian Test",
    guardianPhone: "333",
    relationOfGuardian: "Friend",
    systemAccess: true,
  });

  describe("as guest", () => {
    const cases = [
      ["GET", "/api/v1/students"],
      ["POST", "/api/v1/students"],
      ["GET", "/api/v1/students/1"],
      ["POST", "/api/v1/students/1/status"],
      ["PUT", "/api/v1/students/1"],
    ];

    cases.forEach(([method, url]) => {
      it(`${method} ${url} -> 401`, () =>
        cy.request({ method, url, failOnStatusCode: false }).then((res) => {
          expect(res.status).to.eq(401);
        }));
    });
  });

  describe("as admin", () => {
    it("logs in", () => login());

    it("GET /students -> 200 list", () =>
      api("GET", "/api/v1/students").then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.students).to.be.an("array");
      }));

    it("GET /students?class&section&roll -> 200 filtered", () => {
      const className = `CL${uid()}`;
      const sectionName = `SEC${uid()}`;

      createClass(className);
      api("POST", "/api/v1/sections", { name: sectionName })
        .its("status")
        .should("eq", 200);

      const studentName = "Filter Student";
      const email = `flt${uid()}@school.com`;
      const roll = 42;

      api("POST", "/api/v1/students", studentPayload(studentName, email, className, sectionName, roll))
        .then((res) => {
          expect(res.status).to.eq(200);
        });

      api("GET", `/api/v1/students?class=${className}&section=${sectionName}&roll=${roll}`).then(
        (res) => {
          expect(res.status).to.eq(200);
          const hit = res.body.students.filter(
            (s) => s.email === email
          );
          expect(hit.length).to.eq(1, "filter finds exactly the created student");
        }
      );
    });

    it("add -> list -> detail -> update (in place) -> status toggle", () => {
      const className = `CL${uid()}`;
      const sectionName = `SEC${uid()}`;
      createClass(className);
      api("POST", "/api/v1/sections", { name: sectionName })
        .its("status")
        .should("eq", 200);

      const studentName = `Stu ${uid()}`;
      const email = `stu${uid()}@school.com`;
      const roll = 7;

      api("POST", "/api/v1/students", studentPayload(studentName, email, className, sectionName, roll))
        .then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.message).to.be.a("string");
        });

      api("GET", "/api/v1/students").then((res) => {
        expect(res.status).to.eq(200);
        const student = res.body.students.find((s) => s.email === email);
        expect(student, `student ${email} listed`).to.be.ok;
        const id = student.id;

        api("GET", `/api/v1/students/${id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.name).to.eq(studentName);
          expect(r.body.class).to.eq(className);
        });

        api("PUT", `/api/v1/students/${id}`, {
          ...studentPayload(studentName, email, className, sectionName, roll),
          name: `${studentName}U`,
        }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.message).to.eq("Student updated successfully");
        });

        api("GET", `/api/v1/students/${id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.name).to.eq(`${studentName}U`);
        });

        api("POST", `/api/v1/students/${id}/status`, { status: false }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.message).to.eq("Student status changed successfully");
        });

        api("GET", `/api/v1/students/${id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.systemAccess).to.eq(false);
        });

        api("POST", `/api/v1/students/${id}/status`, { status: true })
          .then((r) => {
            expect(r.status).to.eq(200);
          })
          .then(() => {
            api("GET", `/api/v1/students/${id}`).then((r) => {
              expect(r.status).to.eq(200);
              expect(r.body.systemAccess).to.eq(true);
            });
          });
      });
    });
  });
});