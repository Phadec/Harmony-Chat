
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Image,
   TextInput,
   ScrollView,
   Dimensions, // Import Dimensions
} from "react-native";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";

const { width, height } = Dimensions.get("window"); // Get device dimensions

const ChatScreen = () => {
   return (
      <View style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity style={styles.exit}>
               <Svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                  <Path
                     d="M3.30002 6L6.80002 2.5C7.20003 2.1 7.20003 1.5 6.80002 1.1C6.40002 0.700003 5.80002 0.700003 5.40002 1.1L1.20002 5.3C0.800024 5.7 0.800024 6.3 1.20002 6.7L5.40002 10.9C5.60002 11.1 5.80002 11.2 6.10003 11.2C6.40003 11.2 6.60003 11.1 6.80002 10.9C7.20003 10.5 7.20003 9.9 6.80002 9.5L3.30002 6Z"
                     fill="white"
                  />
               </Svg>
            </TouchableOpacity>
            <View style={styles.online}>
               <Image
                  source={{
                     uri: "https://images.unsplash.com/photo-1509368665003-7b100e67d632?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  }}
                  style={styles.profileImage}
               />
               <View style={styles.onlineIndicator} />
            </View>
            <View>
               <Text style={styles.name}>Dung Senpai</Text>
               <Text style={styles.active}>Active now</Text>
            </View>
            <View style={styles.call}>
               <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
                  <Path
                     d="M21.875 19V17.3541C21.875 16.5363 21.3564 15.8008 20.5654 15.4971L18.4465 14.6835C17.4405 14.2971 16.2939 14.7156 15.8094 15.646L15.625 16C15.625 16 13.0208 15.5 10.9375 13.5C8.85417 11.5 8.33333 9 8.33333 9L8.7021 8.82299C9.67123 8.35781 10.1071 7.25714 9.70473 6.29136L8.85717 4.25722C8.54079 3.4979 7.77473 3 6.92285 3H5.20833C4.05774 3 3.125 3.89543 3.125 5C3.125 13.8366 10.5869 21 19.7917 21C20.9423 21 21.875 20.1046 21.875 19Z"
                     stroke="white"
                     strokeWidth="1.5"
                     strokeLinejoin="round"
                  />
               </Svg>
            </View>
            <Svg
               width="27"
               height="27"
               viewBox="0 0 27 27"
               fill="none"
            >
               <Path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M14.7656 19.9688H5.90625C4.50787 19.9688 3.375 18.8359 3.375 17.4375V9.5625C3.375 8.16412 4.50787 7.03125 5.90625 7.03125H14.7656C16.164 7.03125 17.2969 8.16412 17.2969 9.5625V17.4375C17.2969 18.8359 16.164 19.9688 14.7656 19.9688Z"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
               />
               <Path
                  d="M17.2969 14.7341L21.5663 18.1699C22.3943 18.837 23.625 18.2475 23.625 17.1844V9.81563C23.625 8.7525 22.3943 8.163 21.5663 8.83013L17.2969 12.2659"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
               />
            </Svg>
            <Svg
               width="25"
               height="24"
               viewBox="0 0 25 24"
               fill="none"
            >
               <Path
                  d="M12.5 11C12.2238 11 11.9588 11.1054 11.7635 11.2929C11.5681 11.4804 11.4584 11.7348 11.4584 12V16C11.4584 16.2652 11.5681 16.5196 11.7635 16.7071C11.9588 16.8946 12.2238 17 12.5 17C12.7763 17 13.0413 16.8946 13.2366 16.7071C13.432 16.5196 13.5417 16.2652 13.5417 16V12C13.5417 11.7348 13.432 11.4804 13.2366 11.2929C13.0413 11.1054 12.7763 11 12.5 11ZM12.8959 7.08C12.6423 6.97998 12.3578 6.97998 12.1042 7.08C11.9763 7.12759 11.8595 7.19896 11.7605 7.29C11.6685 7.3872 11.5945 7.49882 11.5417 7.62C11.4834 7.73868 11.4549 7.86882 11.4584 8C11.4576 8.13161 11.4839 8.26207 11.5357 8.38391C11.5875 8.50574 11.6639 8.61656 11.7605 8.71C11.8617 8.79833 11.978 8.86936 12.1042 8.92C12.262 8.98224 12.4333 9.00632 12.6031 8.99011C12.7729 8.97391 12.9359 8.91792 13.0779 8.82707C13.2198 8.73622 13.3364 8.61328 13.4172 8.46907C13.4981 8.32486 13.5409 8.16378 13.5417 8C13.5379 7.73523 13.43 7.48163 13.2396 7.29C13.1406 7.19896 13.0237 7.12759 12.8959 7.08ZM12.5 2C10.4398 2 8.42587 2.58649 6.71286 3.6853C4.99984 4.78412 3.66471 6.3459 2.8763 8.17317C2.08789 10.0004 1.8816 12.0111 2.28353 13.9509C2.68546 15.8907 3.67755 17.6725 5.13435 19.0711C6.59115 20.4696 8.44722 21.422 10.4679 21.8079C12.4885 22.1937 14.5829 21.9957 16.4863 21.2388C18.3897 20.4819 20.0166 19.2002 21.1612 17.5557C22.3058 15.9112 22.9167 13.9778 22.9167 12C22.9167 10.6868 22.6473 9.38642 22.1238 8.17317C21.6003 6.95991 20.833 5.85752 19.8657 4.92893C18.8985 4.00035 17.7501 3.26375 16.4863 2.7612C15.2225 2.25866 13.868 2 12.5 2ZM12.5 20C10.8519 20 9.2407 19.5308 7.87029 18.6518C6.49988 17.7727 5.43178 16.5233 4.80105 15.0615C4.17032 13.5997 4.00529 11.9911 4.32684 10.4393C4.64838 8.88743 5.44205 7.46197 6.60749 6.34315C7.77293 5.22433 9.25779 4.4624 10.8743 4.15372C12.4908 3.84504 14.1664 4.00346 15.6891 4.60896C17.2118 5.21447 18.5133 6.23984 19.429 7.55544C20.3446 8.87103 20.8334 10.4177 20.8334 12C20.8334 14.1217 19.9554 16.1566 18.3926 17.6569C16.8298 19.1571 14.7102 20 12.5 20Z"
                  fill="white"
               />
            </Svg>
         </View>

         <ScrollView style={styles.chatContainer}>
            <View style={styles.centerText}>
               <Text style={styles.todayText}>Today</Text>
            </View>

            <View style={styles.rightMessage}>
               <Text style={styles.messageText}>Hello! Jhon abraham</Text>
               <Text style={styles.timeText}>09:25 AM</Text>
            </View>

            <View style={styles.messageRow}>
               <Image
                  style={styles.messageImage}
                  source={{
                     uri: "https://images.unsplash.com/photo-1509368665003-7b100e67d632?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  }}
               />
               <View style={styles.messageColumn}>
                  <Text style={styles.messageName}>Dung Senpai</Text>
                  <View style={styles.voiceMessage}>
                     <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <Circle cx="11" cy="11" r="11" fill="white" />
                        <Path
                           d="M15.6278 12.7365L9.99228 15.9568C8.65896 16.7187 7 15.756 7 14.2203V11V7.77971C7 6.24407 8.65896 5.28133 9.99228 6.04323L15.6278 9.26353C16.9714 10.0313 16.9714 11.9687 15.6278 12.7365Z"
                           fill="#20A090"
                        />
                     </Svg>
                     <Svg
                        width="122"
                        height="14"
                        viewBox="0 0 122 14"
                        fill="none"
                     >
                        <Path
                           d="M0 5.8457C0 5.29342 0.447715 4.8457 1 4.8457C1.55228 4.8457 2 5.29342 2 5.8457V8.69186C2 9.24414 1.55228 9.69186 1 9.69186C0.447715 9.69186 0 9.24414 0 8.69186V5.8457Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M6 3.1543C6 2.60201 6.44772 2.1543 7 2.1543C7.55228 2.1543 8 2.60201 8 3.1543V11.9235C8 12.4758 7.55228 12.9235 7 12.9235C6.44772 12.9235 6 12.4758 6 11.9235V3.1543Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M12 5.30844C12 4.75616 12.4477 4.30844 13 4.30844C13.5523 4.30844 14 4.75616 14 5.30844V9.76998C14 10.3223 13.5523 10.77 13 10.77C12.4477 10.77 12 10.3223 12 9.76998V5.30844Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M18 2.61328C18 2.061 18.4477 1.61328 19 1.61328C19.5523 1.61328 20 2.061 20 2.61328V12.4594C20 13.0117 19.5523 13.4594 19 13.4594C18.4477 13.4594 18 13.0117 18 12.4594V2.61328Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M24 1.53711C24 0.984824 24.4477 0.537109 25 0.537109C25.5523 0.537109 26 0.984825 26 1.53711V12.9986C26 13.5509 25.5523 13.9986 25 13.9986C24.4477 13.9986 24 13.5509 24 12.9986V1.53711Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M30 3.69141C30 3.13912 30.4477 2.69141 31 2.69141C31.5523 2.69141 32 3.13912 32 3.69141V10.8453C32 11.3975 31.5523 11.8453 31 11.8453C30.4477 11.8453 30 11.3975 30 10.8453V3.69141Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M36 3.1543C36 2.60201 36.4477 2.1543 37 2.1543C37.5523 2.1543 38 2.60201 38 3.1543V11.3851C38 11.9374 37.5523 12.3851 37 12.3851C36.4477 12.3851 36 11.9374 36 11.3851V3.1543Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M42 2.07617C42 1.52389 42.4477 1.07617 43 1.07617C43.5523 1.07617 44 1.52389 44 2.07617V12.4608C44 13.0131 43.5523 13.4608 43 13.4608C42.4477 13.4608 42 13.0131 42 12.4608V2.07617Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M48 3.69141C48 3.13912 48.4477 2.69141 49 2.69141C49.5523 2.69141 50 3.13912 50 3.69141V10.8453C50 11.3975 49.5523 11.8453 49 11.8453C48.4477 11.8453 48 11.3975 48 10.8453V3.69141Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M54 1.53711C54 0.984824 54.4477 0.537109 55 0.537109C55.5523 0.537109 56 0.984825 56 1.53711V12.9986C56 13.5509 55.5523 13.9986 55 13.9986C54.4477 13.9986 54 13.5509 54 12.9986V1.53711Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M60 5.8457C60 5.29342 60.4477 4.8457 61 4.8457C61.5523 4.8457 62 5.29342 62 5.8457V8.69186C62 9.24414 61.5523 9.69186 61 9.69186C60.4477 9.69186 60 9.24414 60 8.69186V5.8457Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M66 4.76758C66 4.21529 66.4477 3.76758 67 3.76758C67.5523 3.76758 68 4.21529 68 4.76758V9.76758C68 10.3199 67.5523 10.7676 67 10.7676C66.4477 10.7676 66 10.3199 66 9.76758V4.76758Z"
                           fill="#20A090"
                        />
                        <Path
                           d="M72 5.8457C72 5.29342 72.4477 4.8457 73 4.8457C73.5523 4.8457 74 5.29342 74 5.8457V8.69186C74 9.24414 73.5523 9.69186 73 9.69186C72.4477 9.69186 72 9.24414 72 8.69186V5.8457Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M78 4.77133C78 4.21905 78.4477 3.77133 79 3.77133C79.5523 3.77133 80 4.21905 80 4.77133V9.77133C80 10.3236 79.5523 10.7713 79 10.7713C78.4477 10.7713 78 10.3236 78 9.77133V4.77133Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M84 2.07617C84 1.52389 84.4477 1.07617 85 1.07617C85.5523 1.07617 86 1.52389 86 2.07617V12.4608C86 13.0131 85.5523 13.4608 85 13.4608C84.4477 13.4608 84 13.0131 84 12.4608V2.07617Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M90 3.69141C90 3.13912 90.4477 2.69141 91 2.69141C91.5523 2.69141 92 3.13912 92 3.69141V10.8453C92 11.3975 91.5523 11.8453 91 11.8453C90.4477 11.8453 90 11.3975 90 10.8453V3.69141Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M96 3.1543C96 2.60201 96.4477 2.1543 97 2.1543C97.5523 2.1543 98 2.60201 98 3.1543V11.3851C98 11.9374 97.5523 12.3851 97 12.3851C96.4477 12.3851 96 11.9374 96 11.3851V3.1543Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M102 1C102 0.447716 102.448 0 103 0C103.552 0 104 0.447715 104 1V13C104 13.5523 103.552 14 103 14C102.448 14 102 13.5523 102 13V1Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M108 3.69141C108 3.13912 108.448 2.69141 109 2.69141C109.552 2.69141 110 3.13912 110 3.69141V10.8453C110 11.3975 109.552 11.8453 109 11.8453C108.448 11.8453 108 11.3975 108 10.8453V3.69141Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M114 5.8457C114 5.29342 114.448 4.8457 115 4.8457C115.552 4.8457 116 5.29342 116 5.8457V8.69186C116 9.24414 115.552 9.69186 115 9.69186C114.448 9.69186 114 9.24414 114 8.69186V5.8457Z"
                           fill="#C1CAD0"
                        />
                        <Path
                           d="M120 4.77133C120 4.21905 120.448 3.77133 121 3.77133C121.552 3.77133 122 4.21905 122 4.77133V9.77133C122 10.3236 121.552 10.7713 121 10.7713C120.448 10.7713 120 10.3236 120 9.77133V4.77133Z"
                           fill="#C1CAD0"
                        />
                     </Svg>

                     <Text style={styles.voiceDuration}>00:16</Text>
                  </View>
                  <Text style={styles.timeText}>09:25 AM</Text>
               </View>
            </View>

            <View style={styles.rightMessage}>
               <Text style={styles.messageText}>Hello! Jhon abraham</Text>
               <Text style={styles.timeText}>09:25 AM</Text>
            </View>

            <View style={styles.messageRow}>
               <Image
                  style={styles.messageImage}
                  source={{
                     uri: "https://images.unsplash.com/photo-1509368665003-7b100e67d632?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  }}
               />
               <View style={styles.messageColumn}>
                  <Text style={styles.messageName}>Dung Senpai</Text>
                  <Text style={styles.incomingMessageText}>Hello! Jhon abraham</Text>
                  <Image
                     style={styles.messageImageLarge}
                     source={{ uri: "https://via.placeholder.com/150" }}
                  />
                  <View style={styles.imageRow}>
                     <Image
                        style={styles.smallImage}
                        source={{ uri: "https://via.placeholder.com/150" }}
                     />
                     <Image
                        style={styles.smallImage}
                        source={{ uri: "https://via.placeholder.com/150" }}
                     />
                  </View>
                  <Text style={styles.timeText}>09:25 AM</Text>
               </View>
            </View>
         </ScrollView>

         <View style={styles.inputSection}>
            <Svg
               width="26"
               height="19"
               viewBox="0 0 26 19"
               fill="none"
            >
               <Path
                  d="M15.4806 6.56071L9.75689 11.5133C8.89509 12.259 8.89509 13.4688 9.75689 14.2145V14.2145C10.6187 14.9602 12.0167 14.9602 12.8785 14.2145L20.4239 7.68557C22.0046 6.31786 22.0046 4.10064 20.4239 2.73293V2.73293C18.8433 1.36523 16.2809 1.36523 14.7002 2.73293L7.15481 9.26182C4.8553 11.2515 4.8553 14.4763 7.15481 16.466V16.466C9.45432 18.4557 13.1811 18.4557 15.4806 16.466L20.0598 12.5037"
                  stroke="#000E08"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
               />
            </Svg>

            <View style={styles.inputField}>
               <TextInput style={styles.input} placeholder="Write your message" />
            </View>
            <Svg
               width="28"
               height="22"
               viewBox="0 0 28 22"
               fill="none"
            >
               <Path
                  d="M8.16665 5.5V6.25C8.3869 6.25 8.59603 6.15318 8.73853 5.98523L8.16665 5.5ZM9.80729 3.56638L9.23541 3.08115V3.08115L9.80729 3.56638ZM18.1927 3.56638L18.7646 3.08115L18.1927 3.56638ZM19.8333 5.5L19.2614 5.98523C19.4039 6.15318 19.6131 6.25 19.8333 6.25V5.5ZM16.75 12.375C16.75 13.3211 15.6973 14.375 14 14.375V15.875C16.1686 15.875 18.25 14.4664 18.25 12.375H16.75ZM14 14.375C12.3026 14.375 11.25 13.3211 11.25 12.375H9.74998C9.74998 14.4664 11.8313 15.875 14 15.875V14.375ZM11.25 12.375C11.25 11.4289 12.3026 10.375 14 10.375V8.875C11.8313 8.875 9.74998 10.2836 9.74998 12.375H11.25ZM14 10.375C15.6973 10.375 16.75 11.4289 16.75 12.375H18.25C18.25 10.2836 16.1686 8.875 14 8.875V10.375ZM8.73853 5.98523L10.3792 4.05162L9.23541 3.08115L7.59476 5.01477L8.73853 5.98523ZM11.7487 3.5H16.2512V2H11.7487V3.5ZM17.6208 4.05162L19.2614 5.98523L20.4052 5.01477L18.7646 3.08115L17.6208 4.05162ZM16.2512 3.5C16.8518 3.5 17.3549 3.73824 17.6208 4.05162L18.7646 3.08115C18.1649 2.37446 17.211 2 16.2512 2V3.5ZM10.3792 4.05162C10.6451 3.73824 11.1482 3.5 11.7487 3.5V2C10.789 2 9.83502 2.37446 9.23541 3.08115L10.3792 4.05162ZM24.9166 9.16667V15.5833H26.4166V9.16667H24.9166ZM21 18.5H6.99998V20H21V18.5ZM3.08331 15.5833V9.16667H1.58331V15.5833H3.08331ZM6.99998 18.5C4.65829 18.5 3.08331 17.0357 3.08331 15.5833H1.58331C1.58331 18.181 4.18701 20 6.99998 20V18.5ZM24.9166 15.5833C24.9166 17.0357 23.3417 18.5 21 18.5V20C23.813 20 26.4166 18.181 26.4166 15.5833H24.9166ZM21 6.25C23.3417 6.25 24.9166 7.71426 24.9166 9.16667H26.4166C26.4166 6.56899 23.813 4.75 21 4.75V6.25ZM6.99998 4.75C4.18701 4.75 1.58331 6.56899 1.58331 9.16667H3.08331C3.08331 7.71426 4.65829 6.25 6.99998 6.25V4.75ZM6.99998 6.25H8.16665V4.75H6.99998V6.25ZM21 4.75H19.8333V6.25H21V4.75Z"
                  fill="#000E08"
               />
               <Ellipse cx="14" cy="5.49998" rx="1.16667" ry="0.916667" fill="#000E08" />
            </Svg>
            <Svg
               width="27"
               height="21"
               viewBox="0 0 27 21"
               fill="none"
            >
               <Path
                  d="M21.375 9.625V10.5C21.375 13.8827 17.8492 16.625 13.5 16.625M5.625 9.625V10.5C5.625 13.8827 9.15076 16.625 13.5 16.625M13.5 16.625V19.25M13.5 19.25H16.875M13.5 19.25H10.125M13.5 14C11.0147 14 9 12.433 9 10.5V5.25C9 3.317 11.0147 1.75 13.5 1.75C15.9853 1.75 18 3.317 18 5.25V10.5C18 12.433 15.9853 14 13.5 14Z"
                  stroke="#000E08"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
               />
            </Svg>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#242c3b",
      borderRadius: 20,
      width: width, // Set container width to device width
      height: height, // Set container height to device height
   },
   header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 15,
   },
   exit: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 5,
      backgroundColor: "#4e4af2",
   },
   online: {
      position: "relative",
   },
   onlineIndicator: {
      position: "absolute",
      width: 10,
      height: 10,
      borderRadius: 100,
      backgroundColor: "#2bef83",
      bottom: 3,
      right: 0,
   },
   profileImage: {
      width: 35,
      height: 35,
      borderRadius: 100,
   },
   name: {
      color: "#fff",
      fontSize: 16,
   },
   active: {
      color: "#ffffff99",
      fontSize: 12,
   },
   call: {
      marginLeft: "auto",
      flexDirection: "row",
      gap: 3,
   },
   chatContainer: {
      paddingHorizontal: 15,
      flex: 1,
   },
   centerText: {
      alignItems: "center",
      marginVertical: 20,
   },
   todayText: {
      backgroundColor: "#f8fbfa",
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 5,
      fontWeight: "600",
      fontSize: 14,
   },
   rightMessage: {
      alignItems: "flex-end",
      marginVertical: 10,
   },
   messageText: {
      backgroundColor: "#20a090",
      color: "#fff",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderTopRightRadius: 0,
   },
   timeText: {
      color: "#797c7b",
      fontSize: 12,
      marginTop: 5,
   },
   messageRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 20,
   },
   messageImage: {
      width: 40,
      height: 40,
      borderRadius: 100,
   },
   messageColumn: {
      flex: 1,
   },
   messageName: {
      color: "#fff",
      fontSize: 16,
   },
   incomingMessageText: {
      backgroundColor: "#fff",
      color: "#000",
      padding: 10,
      borderRadius: 10,
      borderTopLeftRadius: 0,
   },
   messageImageLarge: {
      width: 150,
      height: 150,
      borderRadius: 20,
      marginTop: 10,
   },
   imageRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
   },
   smallImage: {
      width: 66,
      height: 66,
      borderRadius: 20,
   },
   voiceMessage: {
      borderTopLeftRadius: 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 10,
      borderRadius: 10,
      gap: 10,
   },
   voiceDuration: {
      fontSize: 12,
      fontWeight: "500",
      color: "#797c7b",
   },
   inputSection: {
      backgroundColor: "#fff",
      height: 50,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      gap: 10,
   },
   inputField: {
      flex: 1,
      backgroundColor: "#f3f6f6",
      borderRadius: 100,
      paddingHorizontal: 10,
      height: 40,
      alignItems: "center",
      display: "flex",
   },
   input: {
      flex: 1,
      fontSize: 14,
   },
});

export default ChatScreen;
