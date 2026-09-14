// Admin API e2e test.
//
// Scope: log in as the seed admin and exercise every backend route that is
// reachable with an authenticated admin session, without ever tripping over
// the real-world side effects described below.
//
// Rule enforced here: a 500 from any visited route fails the test.
//
// Deliberate exclusions (routes NOT covered here, with reasons):
//   * students/*        : covered separately in students.cy.js (backend bug
//                         in setStudentStatus arg mapping fixed)
//   * POST /staffs/:id/status : can disable the admin's own account
//                         (disabled admin -> lockout; previously bit us)
//   * POST /staffs (add) + resend-email-verification + resend-pwd-setup-link:
//                         need a working SMTP provider; placeholder RESEND
//                         key yields 500 (blocking diff)
//   * POST /account/change-password : would replace the demo password stored
//                         in Readme.md
//   * auth/reset-pwd      : sends a real email -> 500 with placeholder key
//   * access-controls CRUD on seeded rows : covered via the roles permissions
//                         flow instead of mutating seed data
//   * GET /class-teachers/teachers : not a registered route (falls into
//                         "/:id"); 500 is a genuine backend bug, see notes
//
// Namespaces stay SHORT: sections.name is VARCHAR(50) but the FK cascade
// into class_teachers.section_name is VARCHAR(30), so any section rename
// longer than 30 chars 500s (backend bug). Keep every created name < 30.

const ADMIN_EMAIL = "admin@school-admin.com";
const ADMIN_PASSWORD = "3OU4zn3q6Zh9";

describe("Admin API access", () => {
  let csrf = null;

  // short unique suffix (9 digits) so names stay under 30 chars
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

  const login = (username, password) =>
    cy
      .request({
        method: "POST",
        url: "/api/v1/auth/login",
        body: { username, password },
        failOnStatusCode: false,
      })
      .then((res) => {
        if (res.status === 200) {
          return setAuthCookies(res).then(() => res);
        }
        return res;
      });

  it("logs in as admin and receives account + cookies", () =>
    login(ADMIN_EMAIL, ADMIN_PASSWORD).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("id", 1);
      expect(res.body).to.have.property("name", "John Doe");
      expect(res.body).to.have.property("email", ADMIN_EMAIL);
      expect(res.body).to.have.property("role", "admin");
      expect(res.body.menus).to.be.an("array");

      cy.getCookie("accessToken").then((c) => {
        expect(c.value.length).to.be.greaterThan(0);
      });
    }));

  it("rejects an incorrect password", () =>
    login(ADMIN_EMAIL, "wrong-password").its("status").should("eq", 400));

  it("rejects an unknown user", () =>
    login("ghost@school.com", "anything").its("status").should("eq", 400));

  describe("read-only routes (stable status)", () => {
    const cases = [
      ["GET", "/api/v1/account/me", 200],
      ["GET", "/api/v1/dashboard", 200],
      ["GET", "/api/v1/teachers", 404],
      ["GET", "/api/v1/staffs", 200],
      ["GET", "/api/v1/staffs/1", 200],
      ["GET", "/api/v1/roles", 200],
      ["GET", "/api/v1/roles/1", 200],
      ["GET", "/api/v1/roles/2", 200],
      ["GET", "/api/v1/roles/1/permissions", 200],
      ["GET", "/api/v1/roles/1/users", 200],
      ["GET", "/api/v1/roles/2/users", 404],
      ["GET", "/api/v1/access-controls", 200],
      ["GET", "/api/v1/access-controls/me", 200],
    ];

    cases.forEach(([method, url, expected]) => {
      it(`${method} ${url} -> ${expected}`, () =>
        api(method, url).then((res) => {
          expect(res.status).to.eq(expected, `${method} ${url}`);
        }));
    });

    it("GET /api/v1/teachers -> 404 Teachers not found", () =>
      api("GET", "/api/v1/teachers").then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body.error).to.eq("Teachers not found");
      }));

    it("GET /api/v1/roles/2/users -> 404 (role has no users)", () =>
      api("GET", "/api/v1/roles/2/users").then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body.error).to.eq("Users not found");
      }));
  });

  describe("auth as admin", () => {
    it("POST /auth/resend-email-verification -> 400 (already active)", () =>
      api("POST", "/api/v1/auth/resend-email-verification", { userId: 1 }).then(
        (res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.eq("User already in active status. Please login.");
        }
      ));

    it("POST /auth/resend-pwd-setup-link -> 400 (already active)", () =>
      api("POST", "/api/v1/auth/resend-pwd-setup-link", { userId: 1 }).then(
        (res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.eq("User already in active status. Please login.");
        }
      ));
  });

  describe("sections CRUD", () => {
    it("create -> list -> detail -> update -> delete -> gone", () => {
      const name = `CY${uid()}`;

      api("POST", "/api/v1/sections", { name })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/sections").then((res) => {
        expect(res.status).to.eq(200);
        const section = res.body.sections.find((s) => s.name === name);
        expect(section, `section ${name} listed`).to.be.ok;

        api("GET", `/api/v1/sections/${section.id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.name).to.eq(name);
        });

        api("PUT", `/api/v1/sections/${section.id}`, { name: `${name}U` })
          .its("status")
          .should("eq", 200);

        api("DELETE", `/api/v1/sections/${section.id}`)
          .its("status")
          .should("eq", 200);

        api("GET", `/api/v1/sections/${section.id}`).then((r) => {
          expect(r.status).to.eq(404);
          expect(r.body.error).to.eq("Section does not exist");
        });
      });
    });
  });

  describe("departments CRUD", () => {
    it("create -> list -> detail -> update -> delete -> gone", () => {
      const name = `DEP${uid()}`;

      api("POST", "/api/v1/departments", { name })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/departments").then((res) => {
        expect(res.status).to.eq(200);
        const dept = res.body.departments.find((d) => d.name === name);
        expect(dept, `department ${name} listed`).to.be.ok;

        api("GET", `/api/v1/departments/${dept.id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.name).to.eq(name);
        });

        api("PUT", `/api/v1/departments/${dept.id}`, { name: `${name}U` })
          .its("status")
          .should("eq", 200);

        api("DELETE", `/api/v1/departments/${dept.id}`)
          .its("status")
          .should("eq", 200);

        api("GET", `/api/v1/departments/${dept.id}`).then((r) => {
          expect(r.status).to.eq(404);
          expect(r.body.error).to.eq("Department does not exist");
        });
      });
    });
  });

  describe("classes CRUD", () => {
    it("create -> list -> detail -> update -> delete -> gone", () => {
      const name = `CLS${uid()}`;

      api("POST", "/api/v1/classes", { name, sections: null })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/classes").then((res) => {
        expect(res.status).to.eq(200);
        const cls = res.body.classes.find((c) => c.name === name);
        expect(cls, `class ${name} listed`).to.be.ok;

        api("GET", `/api/v1/classes/${cls.id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.name).to.eq(name);
        });

        api("PUT", `/api/v1/classes/${cls.id}`, {
          name: `${name}U`,
          sections: null,
        })
          .its("status")
          .should("eq", 200);

        api("DELETE", `/api/v1/classes/${cls.id}`)
          .its("status")
          .should("eq", 200);

        api("GET", `/api/v1/classes/${cls.id}`).then((r) => {
          expect(r.status).to.eq(404);
          expect(r.body.error).to.eq("Class detail not found");
        });
      });
    });
  });

  describe("class teachers", () => {
    it("assign teacher to a class section -> detail -> update", () => {
      const className = `CC${uid()}`;
      const sectionName = `CS${uid()}`;

      api("POST", "/api/v1/classes", { name: className, sections: null })
        .its("status")
        .should("eq", 200);
      api("POST", "/api/v1/sections", { name: sectionName })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/classes").then((res) => {
        const cls = res.body.classes.find((c) => c.name === className);
        expect(cls).to.be.ok;
        const classId = cls.id;

        api("GET", "/api/v1/sections").then((res) => {
          const sec = res.body.sections.find((s) => s.name === sectionName);
          expect(sec).to.be.ok;
          const sectionId = sec.id;

      api("POST", "/api/v1/class-teachers", {
        class: className,
        section: sectionName,
        teacher: 1,
      })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/class-teachers").then((res) => {
        expect(res.status).to.eq(200);
        const row = res.body.classTeachers.find(
          (c) => c.class === className && c.section === sectionName
        );
        expect(row, `class-teacher for ${className}/${sectionName}`).to.be.ok;

        api("GET", `/api/v1/class-teachers/${row.id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.class).to.eq(className);
          expect(r.body.teacher).to.eq(1);
        });

        api("PUT", `/api/v1/class-teachers/${row.id}`, {
          class: className,
          section: sectionName,
          teacher: 1,
        })
          .its("status")
          .should("eq", 200);

        api("DELETE", `/api/v1/classes/${classId}`).then((r) => {
          expect(r.status).to.eq(200);
        });
        api("DELETE", `/api/v1/sections/${sectionId}`).then((r) => {
          expect(r.status).to.eq(200);
        });
          });
        });
      });
    });
  });

  describe("roles & permissions CRUD", () => {
    it("create role -> detail -> update -> status -> permissions -> users", () => {
      const name = `RL${uid()}`;

      api("POST", "/api/v1/roles", { name }).then((res) => {
        expect(res.status).to.eq(200);

        api("GET", "/api/v1/roles").then((r) => {
          expect(r.status).to.eq(200);
          const role = r.body.roles.find((role) => role.name === name);
          expect(role, `role ${name} created`).to.be.ok;
          const id = role.id;

          api("GET", `/api/v1/roles/${id}`).then((r2) => {
            expect(r2.status).to.eq(200);
            expect(r2.body.name).to.eq(name);
          });

          api("PUT", `/api/v1/roles/${id}`, { name: `${name}U` })
            .its("status")
            .should("eq", 200);

          api("POST", `/api/v1/roles/${id}/status`, { status: false })
            .its("status")
            .should("eq", 200);
          api("POST", `/api/v1/roles/${id}/status`, { status: true })
            .its("status")
            .should("eq", 200);

          api("POST", `/api/v1/roles/${id}/permissions`, { permissions: "3" })
            .its("status")
            .should("eq", 200);

          api("GET", `/api/v1/roles/${id}/permissions`).then((r2) => {
            expect(r2.status).to.eq(200);
            expect(r2.body.permissions).to.be.an("array");
          });

          api("GET", `/api/v1/roles/${id}/users`).then((r2) => {
            expect(r2.status).to.eq(404);
            expect(r2.body.error).to.eq("Users not found");
          });

          api("POST", "/api/v1/roles/switch", { userId: 1, roleId: id })
            .its("status")
            .should("eq", 200);
          api("POST", "/api/v1/roles/switch", { userId: 1, roleId: 1 })
            .its("status")
            .should("eq", 200);
        });
      });
    });
  });

  describe("notices CRUD", () => {
    it("create notice -> list -> detail -> update -> status + recipients", () => {
      const title = `NT${uid()}`;

      api("POST", "/api/v1/notices", {
        title,
        description: "cypress generated notice",
        recipientType: "EV",
        recipientRole: 3,
        recipientFirstField: "",
        status: 1,
      })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/notices").then((res) => {
        expect(res.status).to.eq(200);
        const notice = res.body.notices.find((n) => n.title === title);
        expect(notice, `notice ${title} listed`).to.be.ok;

        api("GET", `/api/v1/notices/${notice.id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.title).to.eq(title);
        });

        api("PUT", `/api/v1/notices/${notice.id}`, {
          title: `${title}U`,
          description: "cypress generated notice",
          recipientType: "EV",
          recipientRole: 3,
          recipientFirstField: "",
          status: 1,
        })
          .its("status")
          .should("eq", 200);

        api("POST", `/api/v1/notices/${notice.id}/status`, { status: 2 })
          .its("status")
          .should("eq", 200);
      });

      api("POST", "/api/v1/notices/recipients", { roleId: 2 })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/notices/recipients").then((res) => {
        expect(res.status).to.eq(200);
        const recipient = res.body.noticeRecipients.find(
          (r) => r.roleId === 2 && r.primaryDependentName === null
        );
        expect(recipient, "unassigned notice recipient role 2").to.be.ok;

        api("GET", `/api/v1/notices/recipients/${recipient.id}`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.roleId).to.eq(2);
        });

        api("PUT", `/api/v1/notices/recipients/${recipient.id}`, {
          roleId: 2,
          primaryDependentName: `NCD${uid()}`,
          primaryDependentSelect: "",
        })
          .its("status")
          .should("eq", 200);

        api("DELETE", `/api/v1/notices/recipients/${recipient.id}`)
          .its("status")
          .should("eq", 200);

        api("GET", `/api/v1/notices/recipients/${recipient.id}`).then((r) => {
          expect(r.status).to.eq(404);
          expect(r.body.error).to.eq("Recipient detail not found");
        });
      });
    });
  });

  describe("leave policies & requests", () => {
    it("policy -> assign users -> leave request -> approve -> cleanup", () => {
      const policyName = `LP${uid()}`;

      api("POST", "/api/v1/leave/policies", { name: policyName })
        .its("status")
        .should("eq", 200);

      api("GET", "/api/v1/leave/policies").then((res) => {
        expect(res.status).to.eq(200);
        const policy = res.body.leavePolicies.find((p) => p.name === policyName);
        expect(policy, `policy ${policyName} listed`).to.be.ok;
        const policyId = policy.id;

        api("PUT", `/api/v1/leave/policies/${policyId}`, {
          name: `${policyName}U`,
        })
          .its("status")
          .should("eq", 200);

        api("POST", `/api/v1/leave/policies/${policyId}/status`, { status: true })
          .its("status")
          .should("eq", 200);

        api("POST", `/api/v1/leave/policies/${policyId}/users`, { users: "1" })
          .its("status")
          .should("eq", 200);

        api("GET", `/api/v1/leave/policies/${policyId}/users`).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.body.users).to.be.an("array");
          expect(r.body.users.length).to.be.greaterThan(0);
        });

        api("GET", "/api/v1/leave/policies/me").its("status").should("eq", 200);

        api("GET", "/api/v1/leave/policies/eligible-users")
          .its("status")
          .should("eq", 200);

        api("POST", "/api/v1/leave/request", {
          policy: policyId,
          from: "2026-01-05",
          to: "2026-01-06",
          note: "cypress leave request",
        })
          .its("status")
          .should("eq", 200);

        api("GET", "/api/v1/leave/request").then((r) => {
          expect(r.status).to.eq(200);
          const req = r.body.leaveHistory.find(
            (l) => l.note === "cypress leave request"
          );
          expect(req, "leave request in history").to.be.ok;
          const requestId = req.id;

          api("PUT", `/api/v1/leave/request/${requestId}`, {
            policy: policyId,
            from: "2026-01-07",
            to: "2026-01-08",
            note: "cypress leave request updated",
          })
            .its("status")
            .should("eq", 200);

          api("GET", "/api/v1/leave/pending").then((p) => {
            expect(p.status).to.eq(200);
            const pend = p.body.pendingLeaves.find(
              (l) => l.id === requestId
            );
            expect(pend, `request ${requestId} is pending`).to.be.ok;
          });

          api("POST", `/api/v1/leave/pending/${requestId}/status`, {
            status: 2,
          })
            .its("status")
            .should("eq", 200);

          api("DELETE", `/api/v1/leave/request/${requestId}`)
            .its("status")
            .should("eq", 200);

          api("GET", "/api/v1/leave/request").then((h) => {
            expect(h.status).to.eq(404);
            expect(h.body.error).to.eq("Leaves not found");
          });
        });

        api("DELETE", `/api/v1/leave/policies/${policyId}/users`, {
          user: 1,
        })
          .its("status")
          .should("eq", 200);

        api("GET", `/api/v1/leave/policies/${policyId}/users`).then((r) => {
          expect(r.status).to.eq(404);
          expect(r.body.error).to.eq("Policy users not found");
        });
      });
    });
  });

  describe("session cleanup", () => {
    it("POST /auth/logout -> 204 (clears the session)", () =>
      api("POST", "/api/v1/auth/logout").its("status").should("eq", 204));
  });
});