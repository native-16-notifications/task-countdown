
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Entypo } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  Button,
} from "react-native";
import uuid from "react-native-uuid";
import * as Notifications from "expo-notifications";
import Countdown from "./components/Countdown";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PICKER_MODE = Platform.select({
  ios: "datetime",
  android: "date",
});

const PICKER_DISPLAY = Platform.select({
  ios: "inline",
  android: "default",
});

const PICKER_SHOW = Platform.select({
  ios: true,
  android: false,
});

const EMOJIS = ["⏳", "🎂", "🎉", "✈️", "🎓", "💍", "🏡", "🎄"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [inputDate, setDate] = useState(new Date(Date.now() + 60000));
  const [selectedEmoji, setSelectedEmoji] = useState("⏳");
  const [mode, setMode] = useState(PICKER_MODE);
  const [show, setShow] = useState(PICKER_SHOW);

  useEffect(() => {
    async function configureNotifications() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("countdowns", {
          name: "Countdown reminders",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: "default",
        });
      }

      const { status } = await Notifications.getPermissionsAsync();

      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    }

    configureNotifications();
  }, []);

  const addToList = async () => {
    if (inputValue.trim() === "") {
      Alert.alert("Oops", "Input is empty");
      return;
    }

    if (inputDate <= new Date()) {
      Alert.alert("Oops", "Date must be future");
      return;
    }

    const newItem = {
      id: String(uuid.v4()),
      title: inputValue.trim(),
      emoji: selectedEmoji,
      date: inputDate,
    };

    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        const notificationId =
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${newItem.emoji} ${newItem.title}`,
              body: "Настав час вашої події!",
              data: { eventId: newItem.id },
              sound: "default",
            },
            trigger: {
              date: newItem.date,
              ...(Platform.OS === "android"
                ? { channelId: "countdowns" }
                : {}),
            },
          });

        newItem.notificationId = notificationId;
      }
    } catch (error) {
      console.log(error);
    }

    setTasks((currentTasks) => [newItem, ...currentTasks]);
    setInputValue("");
    setSelectedEmoji("⏳");
    Keyboard.dismiss();
  };

  const deleteFromList = async (id) => {
    const item = tasks.find((task) => task.id === id);

    if (item) {
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== id)
      );

      if (item.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          item.notificationId
        );
      }
    }
  };

  const onChange = (event, selectedDate) => {
    if (!selectedDate) {
      if (Platform.OS === "android") {
        setShow(false);
        setMode("date");
      }
      return;
    }

    if (Platform.OS === "android" && mode === "date") {
      setDate(selectedDate);
      setMode("time");
      return;
    }

    if (Platform.OS === "android") {
      setShow(false);
      setMode("date");
    }

    setDate(selectedDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.taskWrapper}>
        <Text style={styles.sectionTitle}>Countdowns</Text>

        <TextInput
          value={inputValue}
          style={styles.input}
          placeholder="Enter Countdown Title..."
          testID="input"
          onChangeText={setInputValue}
        />

        <Text style={styles.emojiLabel}>Choose emoji:</Text>

        <View style={styles.emojiPicker}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => setSelectedEmoji(emoji)}
              style={[
                styles.emojiOption,
                selectedEmoji === emoji && styles.selectedEmoji,
              ]}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.timeBtnWithText}>
          <Button
            color="#085252"
            testID="showPickerButton"
            onPress={() => setShow(!show)}
            title={show ? "Hide time picker" : "Select time 🕒"}
          />
          <Text>{inputDate.toLocaleString()}</Text>
        </View>

        <View style={styles.datePicker}>
          {show && (
            <DateTimePicker
              value={inputDate}
              testID="picker"
              onChange={onChange}
              mode={mode}
              is24Hour
              display={PICKER_DISPLAY}
            />
          )}
        </View>

        <TouchableOpacity onPress={addToList} testID="addBtn">
          <View style={styles.startBtn}>
            <Text style={{ color: "white" }}>Start Countdown</Text>
            <Entypo
              style={{ marginLeft: 5 }}
              name="hour-glass"
              size={20}
              color="white"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.items}>
          <FlatList
            keyExtractor={(item) => item.id}
            data={tasks}
            renderItem={({ item }) => (
              <Countdown
                countdown={item}
                deleteFromList={deleteFromList}
              />
            )}
          />
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    backgroundColor: "#E8EAED",
  },
  startBtn: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#008080",
  },
  taskWrapper: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 38,
    fontWeight: "bold",
    marginBottom: 10,
  },
  items: {
    flex: 1,
    marginTop: 30,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  datePicker: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  timeBtnWithText: {
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emojiLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  emojiPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiOption: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedEmoji: {
    borderColor: "#008080",
    backgroundColor: "#d7eeee",
  },
  emojiText: {
    fontSize: 24,
  },
});
