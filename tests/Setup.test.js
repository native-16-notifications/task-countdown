import { render } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import App from "../App";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notification-id")),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    DEFAULT: 3,
  },
}));

test("Setup notifications invokes", () => {
  render(<App />);
  expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
});
