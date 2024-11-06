import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000E08",
    position: "relative",
    overflow: "hidden",
  },
  backGround: {
    flex: 1,
    backgroundColor: "rgba(37, 45, 60, 0.4)",
  },
});

export const headerStyles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  searchContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  borderContainer: {
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});

export const navStyles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  containerIcon: {
    marginLeft: 10,
    marginRight: 10,
    width: 50,
    height: 50,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    textAlign: "center",
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

export const flatStyle = StyleSheet.create({
  containerFlat: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: 40,
  },
  flatList: {
    backgroundColor: "white",
  },
  recentCallText: {
    backgroundColor: "white",
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#F5F5F5",
    fontSize: 16,
    paddingBottom: 10,
    paddingTop: 10,
    paddingLeft: 30,
  },
});

export const ListCallItems = StyleSheet.create({
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginVertical: 15,
    marginHorizontal: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  borderBottom: {
    position: "absolute",
    width: width - 125,
    bottom: -15,
    right: 15,
    height: 1,
    backgroundColor: "#ccc",
    opacity: 0.3,
  },
  name: {
    fontSize: 18,
    color: "#000",
  },
  statusTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
    marginTop: 5,
  },
  icons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export const SpecialItems = StyleSheet.create({
  specialItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginVertical: 10,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  borderBottom: {
    position: "absolute",
    width: width - 125,
    bottom: 0,
    right: 15,
    height: 1,
    backgroundColor: "#ccc",
    opacity: 0.3,
  },
  name: {
    fontSize: 18,
    color: "#000",
  },
  statusTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontWeight: "bold",
  },
  emojiReactions: {
    flexDirection: "row",
    position: "relative",
    width: 50,
    height: 24,
  },
  emoji: {
    position: "absolute",
    fontSize: 24,
  },
});

export const footerStyles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#101C43",
  },
});

export const carouselStyles = StyleSheet.create({
  carouselContainer: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    position: "relative",
    shadowColor: "#3B475F",
    width: width * 0.9,
    height: 250,
    borderRadius: 20,
    padding: 10,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: "rgba(0, 0, 0, 0.3)",
    elevation: 5,
  },
  slideContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  wrapper: {
    height: "100%",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
    borderRadius: 10,
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  likes: {
    color: "white",
    fontSize: 16,
    marginRight: 5,
  },
});

export const listChatstyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
    borderRadius: 20,
    marginBottom: 10,
    width: width * 0.9,
    alignSelf: "center",
    overflow: "hidden",
    borderColor: "#222",
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    overflow: "hidden",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    minWidth: 100,
    borderBottomWidth: 1,
    borderColor: "#555",
  },
  avatar: {
    position: "relative",
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 15,
  },
  onlineIndicator: {
    position: "absolute",
    backgroundColor: "#31a24c",
    bottom: 0,
    right: 15,
    width: 12,
    height: 12,
    borderRadius: 5,
    zIndex: 1,
  },
  messageContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  sender: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    fontSize: 14,
    color: "#BDC3C7",
    marginRight: 80,
  },
  time: {
    fontSize: 12,
    marginTop: 3,
    bottom: 0,
    right: 0,
    position: "absolute",
    color: "#BDC3C7",
    textAlign: "right",
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  unreadText: {
    color: "white",
    fontWeight: "bold",
  },
  iconContainer: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "row",
  },
  iconBell: {
    marginLeft: 15,
    padding: 8,
    backgroundColor: "black",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  iconTrash: {
    marginLeft: 15,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "red",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});

export const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "33%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#D9DBE9",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 20,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
  },
  item: {
    borderRadius: 20,
    width: 144,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    backgroundColor: "transparent",
    overflow: "hidden",
    shadowColor: "#10141C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  },
  subText: {
    fontSize: 13,
    paddingTop: 6,
    color: "#A9A9A9",
    width: "100%",
    marginTop: 8,
    textAlign: "left",
  },
  mainText: {
    fontSize: 15,
    color: "#FFF",
    paddingTop: 2,
    fontWeight: "bold",
    width: "100%",
    textAlign: "left",
  },
});

export const cameraScreenStyles = StyleSheet.create({
  viewContainer: {
    display: "flex",
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 20,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    padding: 20,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    width: "100%",
    borderRadius: 10,
  },
  flashButton: {
    padding: 12,
    borderRadius: 30,
  },
  exitButton: {
    color: "#fff",
    padding: 12,
    borderRadius: 30,
  },
  iconButton: {
    borderRadius: 10,
    width: 60,
    height: 60,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  iconText: {
    color: "#000",
    textAlign: "center",
  },
  galleryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
});

export const cameraPreviewStyles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    flex: 1,
    width: "100%",
    height: "100%",
  },
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 60,
  },
  button: {
    width: 80,
    paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 1,
  },
});
