import User from "../models/user.model";
import AuthService from "../services/auth.service";
import { connect, clearDatabase, closeDatabase } from "./helpers/db";

// Mock the entire TokenService
vi.mock("../services/token.service", () => ({
  default: {
    generateAccessToken: vi.fn().mockReturnValue("mock-access-token"),
    generateRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
  },
}));

describe("AuthService", () => {
  let userData;
  beforeEach(() => {
    userData = {
      email: "test@example.com",
      username: "testuser",
      name: "John Doe",
      phone: "+77071112233",
      password: "1234",
      fingerprint: {
        hash: "mock-fingerprint",
      },
    };
  });
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  describe("AuthService CRUD", () => {
    it("should create user with valid data", async () => {
      const response = await AuthService.register(userData);

      expect(response.accessToken).toBe("mock-access-token");
      expect(response.refreshToken).toBe("mock-refresh-token");

      // Verify in database
      const savedUser = await User.findOne({ phone: userData.phone });

      expect(savedUser).toBeTruthy();
    });

    it("should throw error for duplicate email", async () => {
      await AuthService.register(userData);

      await expect(async () => {
        await AuthService.register(userData);
      }).rejects.toThrow();
    });

    it("should login user with valid credentials", async () => {
      const loginData = {
        username: userData.username,
        password: userData.password,
        fingerprint: userData.fingerprint,
      };

      await AuthService.register(userData);
      const response = await AuthService.login(loginData);
      expect(response.accessToken).toBe("mock-access-token");
      expect(response.refreshToken).toBe("mock-refresh-token");
    });

    it("should update user data", async () => {
      await AuthService.register(userData);

      const updatedData = {
        name: "Jane Doe",
        phone: "+77071112234",
      };

      const savedUser = await User.findOne({ email: userData.email });

      await AuthService.update(savedUser._id, updatedData, null, true);

      const updatedUser = await User.findOne({ email: userData.email });

      expect(updatedUser.name).toBe(updatedData.name);
      expect(updatedUser.phone).toBe(updatedData.phone);
    });
  });
});
