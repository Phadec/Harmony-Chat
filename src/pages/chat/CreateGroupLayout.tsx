
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";

const CreateGroup = () => {
   const handleBackPress = () => {
      // Handle back navigation here
      console.log("Back button pressed");
   };

   return (
      <ScrollView contentContainerStyle={styles.container}>
         {/* Header */}
         <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
               {/* Back Arrow Icon */}
               <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                     d="M15 19L8 12L15 5"
                     stroke="#000"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  />
               </Svg>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create Group</Text>
         </View>

         {/* Group Description */}
         <Text style={styles.desc}>Group Description</Text>
         <View style={styles.groupDescription}>
            <Text style={styles.groupTitle}>Make Group for Team Work</Text>
            <View style={styles.tags}>
               <View style={styles.tag}>
                  <Text style={styles.tagText}>Group work</Text>
               </View>
               <View style={styles.tag}>
                  <Text style={styles.tagText}>Team relationship</Text>
               </View>
            </View>
         </View>

         {/* Admin Section */}
         <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Group Admin</Text>
            <View style={styles.adminInfo}>
               <Image
                  source={{ uri: "https://via.placeholder.com/50x50" }}
                  style={styles.adminImage}
               />
               <View>
                  <Text style={styles.adminName}>Rashid Khan</Text>
                  <Text style={styles.adminRole}>Group Admin</Text>
               </View>
            </View>
         </View>

         {/* Members Section */}
         <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Invited Members</Text>
            <View style={styles.members}>
               {/* Render 5 members with images */}
               {Array.from({ length: 5 }).map((_, index) => (
                  <View key={index} style={styles.member}>
                     <Image
                        source={{
                           uri: "https://images.unsplash.com/photo-1509368665003-7b100e67d632?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        }}
                        style={styles.memberImage}
                     />
                     <View style={styles.addIcon}>
                        <Text>+</Text>
                     </View>
                  </View>
               ))}
               {/* Add Member Button */}
               <TouchableOpacity style={styles.addMember}>
                  <Text style={styles.addIconText}>+</Text>
               </TouchableOpacity>
            </View>
         </View>

         {/* Create Button */}
         <View style={styles.createBtn}>
            <TouchableOpacity style={styles.createBtnContainer}>
               <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
         </View>
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   container: {
      backgroundColor: "#fff",
      padding: 20,
      alignItems: "center",
      flexGrow: 1,
   },
   header: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      marginBottom: 20,
   },
   backButton: {
      position: "absolute",
      left: 0,
      padding: 10,
   },
   headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
   },
   desc: {
      marginTop: 20,
      color: "#888",
      alignSelf: "flex-start",
   },
   groupDescription: {
      marginTop: 15,
      width: "100%",
   },
   groupTitle: {
      fontSize: 28,
      fontWeight: "bold",
      lineHeight: 34,
   },
   tags: {
      flexDirection: "row",
      marginTop: 10,
      gap: 10,
   },
   tag: {
      backgroundColor: "#e6f7ee",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
   },
   tagText: {
      color: "#17a96d",
      fontSize: 14,
      fontWeight: "500",
   },
   adminSection: {
      marginTop: 30,
      width: "100%",
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#888",
   },
   adminInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 15,
   },
   adminImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
   },
   adminName: {
      fontSize: 16,
      fontWeight: "bold",
   },
   adminRole: {
      fontSize: 14,
      color: "#888",
   },
   membersSection: {
      marginTop: 30,
      width: "100%",
   },
   members: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 15,
      gap: 15,
   },
   member: {
      width: 60,
      height: 60,
      position: "relative",
      borderRadius: 30,
   },
   memberImage: {
      width: "100%",
      height: "100%",
      borderRadius: 30,
   },
   addIcon: {
      position: "absolute",
      right: 0,
      bottom: 0,
      backgroundColor: "white",
      borderRadius: 20,
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#ccc",
   },
   addMember: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: "#ccc",
      justifyContent: "center",
      alignItems: "center",
      borderStyle: "dashed",
      backgroundColor: "white",
   },
   addIconText: {
      fontSize: 26,
      color: "#CFD3D2",
   },
   createBtn: {
      marginTop: 30,
      width: "100%",
   },
   createBtnContainer: {
      backgroundColor: "#17a96d",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
   },
   createBtnText: {
      color: "white",
      fontSize: 18,
   },
});

export default CreateGroup;
