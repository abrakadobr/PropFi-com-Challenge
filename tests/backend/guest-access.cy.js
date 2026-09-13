const UNAUTHORIZED_STATUS = 401;
const UNAUTHORIZED_MESSAGE = "Unauthorized. Please provide valid tokens.";

const protectedRoutes = [
  { method: "GET", url: "/api/v1/teachers" },
  { method: "GET", url: "/api/v1/dashboard" },

  { method: "GET", url: "/api/v1/access-controls" },
  { method: "POST", url: "/api/v1/access-controls" },
  { method: "PUT", url: "/api/v1/access-controls/1" },
  { method: "DELETE", url: "/api/v1/access-controls/1" },
  { method: "GET", url: "/api/v1/access-controls/me" },

  { method: "POST", url: "/api/v1/auth/logout" },
  { method: "POST", url: "/api/v1/auth/resend-email-verification" },
  { method: "POST", url: "/api/v1/auth/resend-pwd-setup-link" },
  { method: "POST", url: "/api/v1/auth/reset-pwd" },

  { method: "GET", url: "/api/v1/account/me" },
  { method: "POST", url: "/api/v1/account/change-password" },

  { method: "POST", url: "/api/v1/leave/policies" },
  { method: "GET", url: "/api/v1/leave/policies" },
  { method: "GET", url: "/api/v1/leave/policies/me" },
  { method: "PUT", url: "/api/v1/leave/policies/1" },
  { method: "POST", url: "/api/v1/leave/policies/1/status" },
  { method: "POST", url: "/api/v1/leave/policies/1/users" },
  { method: "GET", url: "/api/v1/leave/policies/1/users" },
  { method: "DELETE", url: "/api/v1/leave/policies/1/users" },
  { method: "GET", url: "/api/v1/leave/policies/eligible-users" },
  { method: "GET", url: "/api/v1/leave/request" },
  { method: "POST", url: "/api/v1/leave/request" },
  { method: "PUT", url: "/api/v1/leave/request/1" },
  { method: "DELETE", url: "/api/v1/leave/request/1" },
  { method: "GET", url: "/api/v1/leave/pending" },
  { method: "POST", url: "/api/v1/leave/pending/1/status" },

  { method: "GET", url: "/api/v1/classes" },
  { method: "GET", url: "/api/v1/classes/1" },
  { method: "POST", url: "/api/v1/classes" },
  { method: "PUT", url: "/api/v1/classes/1" },
  { method: "DELETE", url: "/api/v1/classes/1" },

  { method: "GET", url: "/api/v1/class-teachers" },
  { method: "POST", url: "/api/v1/class-teachers" },
  { method: "GET", url: "/api/v1/class-teachers/1" },
  { method: "PUT", url: "/api/v1/class-teachers/1" },

  { method: "GET", url: "/api/v1/sections" },
  { method: "POST", url: "/api/v1/sections" },
  { method: "GET", url: "/api/v1/sections/1" },
  { method: "PUT", url: "/api/v1/sections/1" },
  { method: "DELETE", url: "/api/v1/sections/1" },

  { method: "GET", url: "/api/v1/students" },
  { method: "POST", url: "/api/v1/students" },
  { method: "GET", url: "/api/v1/students/1" },
  { method: "POST", url: "/api/v1/students/1/status" },
  { method: "PUT", url: "/api/v1/students/1" },

  { method: "GET", url: "/api/v1/notices/recipients/list" },
  { method: "GET", url: "/api/v1/notices/recipients" },
  { method: "GET", url: "/api/v1/notices/recipients/1" },
  { method: "POST", url: "/api/v1/notices/recipients" },
  { method: "PUT", url: "/api/v1/notices/recipients/1" },
  { method: "DELETE", url: "/api/v1/notices/recipients/1" },
  { method: "POST", url: "/api/v1/notices/1/status" },
  { method: "GET", url: "/api/v1/notices/pending" },
  { method: "GET", url: "/api/v1/notices/1" },
  { method: "GET", url: "/api/v1/notices" },
  { method: "POST", url: "/api/v1/notices" },
  { method: "PUT", url: "/api/v1/notices/1" },

  { method: "GET", url: "/api/v1/staffs" },
  { method: "POST", url: "/api/v1/staffs" },
  { method: "GET", url: "/api/v1/staffs/1" },
  { method: "PUT", url: "/api/v1/staffs/1" },
  { method: "POST", url: "/api/v1/staffs/1/status" },

  { method: "GET", url: "/api/v1/departments" },
  { method: "POST", url: "/api/v1/departments" },
  { method: "GET", url: "/api/v1/departments/1" },
  { method: "PUT", url: "/api/v1/departments/1" },
  { method: "DELETE", url: "/api/v1/departments/1" },

  { method: "GET", url: "/api/v1/roles" },
  { method: "POST", url: "/api/v1/roles" },
  { method: "POST", url: "/api/v1/roles/switch" },
  { method: "PUT", url: "/api/v1/roles/1" },
  { method: "POST", url: "/api/v1/roles/1/status" },
  { method: "GET", url: "/api/v1/roles/1" },
  { method: "GET", url: "/api/v1/roles/1/permissions" },
  { method: "POST", url: "/api/v1/roles/1/permissions" },
  { method: "GET", url: "/api/v1/roles/1/users" },
];

describe("Guest access (unauthenticated user)", () => {
  describe("Protected routes are rejected with 401", () => {
    protectedRoutes.forEach(({ method, url }) => {
      it(`${method} ${url}`, () => {
        cy.request({ method, url, failOnStatusCode: false }).then((response) => {
          expect(response.status).to.eq(UNAUTHORIZED_STATUS);
          expect(response.body).to.deep.equal({
            error: UNAUTHORIZED_MESSAGE,
          });
        });
      });
    });
  });

  describe("Public auth routes", () => {
    it("POST /api/v1/auth/login without credentials returns 400 Validation error", () => {
      cy.request({
        method: "POST",
        url: "/api/v1/auth/login",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.eq("Validation error");
        expect(response.body.detail).to.be.an("array");
        expect(response.body.detail.length).to.eq(2);
      });
    });

    it("GET /api/v1/auth/refresh without refresh token returns 401", () => {
      cy.request({
        method: "GET",
        url: "/api/v1/auth/refresh",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.deep.equal({ error: "Invalid refresh token" });
      });
    });

    it("GET /api/v1/auth/verify-email/invalid-token returns 400 Invalid token", () => {
      cy.request({
        method: "GET",
        url: "/api/v1/auth/verify-email/invalid-token",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.deep.equal({ error: "Invalid token" });
      });
    });

    it("POST /api/v1/auth/setup-password without token returns 404 Invalid token", () => {
      cy.request({
        method: "POST",
        url: "/api/v1/auth/setup-password",
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.deep.equal({ error: "Invalid token" });
      });
    });
  });

  describe("Unknown route", () => {
    it("GET /api/v1/unknown returns 404 Resource not found", () => {
      cy.request({
        method: "GET",
        url: "/api/v1/unknown",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.deep.equal({ error: "Resource not found" });
      });
    });
  });
});