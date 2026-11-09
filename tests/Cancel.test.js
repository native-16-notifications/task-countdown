import {
  render,
  screen,
  userEvent,
  act,
  fireEvent,
} from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import App from "../App";
import { getNextMinuteCurrentTime } from "../utils.js/time";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() =>
    Promise.resolve("notification-id")
  ),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    DEFAULT: 3,
  },
}));

const createDateTimeSetEvtParams = (date) => {
  return [
    {
      type: "set",
      nativeEvent: {
        timestamp: date.getTime(),
      },
    },
    date,
  ];
};

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

test("Notification removes correctly", async () => {
  jest.useFakeTimers();

  render(<App />);

  const titleInput = screen.getByTestId("input");
  const timePicker = screen.UNSAFE_getByType(DateTimePicker);
  const addBtn = screen.getByTestId("addBtn");

  const user = userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
  });

  await user.type(titleInput, "Good Day!");

  act(() => {
    fireEvent(
      timePicker,
      "onChange",
      ...createDateTimeSetEvtParams(getNextMinuteCurrentTime())
    );
  });

  await user.press(addBtn);

  const removeBtn = await screen.findByTestId("removeBtn");

  await user.press(removeBtn);

  await act(async () => {
    await Promise.resolve();
  });

  expect(
    Notifications.cancelScheduledNotificationAsync
  ).toHaveBeenCalled();
});