
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Image,
   ScrollView,
   TextInput,
   Dimensions,
} from "react-native";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const items = [
   {
      text: "Camera",
      icon: (
         <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
            <Path
               d="M8.41597 6.76846V7.51846C8.65613 7.51846 8.88176 7.40346 9.02286 7.20913L8.41597 6.76846ZM10.008 4.57593L9.40112 4.13527V4.13527L10.008 4.57593ZM18.1449 4.57594L18.7518 4.13527L18.1449 4.57594ZM19.7369 6.76846L19.13 7.20913C19.2712 7.40346 19.4968 7.51846 19.7369 7.51846V6.76846ZM16.7227 14.564C16.7227 15.8129 15.5996 16.9323 14.0765 16.9323V18.4323C16.3048 18.4323 18.2227 16.7594 18.2227 14.564H16.7227ZM14.0765 16.9323C12.5534 16.9323 11.4302 15.8129 11.4302 14.564H9.93017C9.93017 16.7594 11.8481 18.4323 14.0765 18.4323V16.9323ZM11.4302 14.564C11.4302 13.3151 12.5534 12.1958 14.0765 12.1958V10.6958C11.8481 10.6958 9.93017 12.3686 9.93017 14.564H11.4302ZM14.0765 12.1958C15.5996 12.1958 16.7227 13.3151 16.7227 14.564H18.2227C18.2227 12.3686 16.3048 10.6958 14.0765 10.6958V12.1958ZM9.02286 7.20913L10.6149 5.0166L9.40112 4.13527L7.80909 6.3278L9.02286 7.20913ZM11.8919 4.40024H16.261V2.90024H11.8919V4.40024ZM17.538 5.0166L19.13 7.20913L20.3438 6.3278L18.7518 4.13527L17.538 5.0166ZM16.261 4.40024C16.7946 4.40024 17.2687 4.64573 17.538 5.0166L18.7518 4.13527C18.1812 3.34949 17.2415 2.90024 16.261 2.90024V4.40024ZM10.6149 5.0166C10.8842 4.64573 11.3583 4.40024 11.8919 4.40024V2.90024C10.9114 2.90024 9.97168 3.34949 9.40112 4.13527L10.6149 5.0166ZM24.6474 10.9261V18.202H26.1474V10.9261H24.6474ZM20.869 21.6096H7.28388V23.1096H20.869V21.6096ZM3.50549 18.202V10.9261H2.00549V18.202H3.50549ZM7.28388 21.6096C5.13554 21.6096 3.50549 20.0249 3.50549 18.202H2.00549C2.00549 20.9714 4.4303 23.1096 7.28388 23.1096V21.6096ZM24.6474 18.202C24.6474 20.0249 23.0174 21.6096 20.869 21.6096V23.1096C23.7226 23.1096 26.1474 20.9714 26.1474 18.202H24.6474ZM20.869 7.51846C23.0174 7.51846 24.6474 9.10314 24.6474 10.9261H26.1474C26.1474 8.15667 23.7226 6.01846 20.869 6.01846V7.51846ZM7.28388 6.01846C4.4303 6.01846 2.00549 8.15667 2.00549 10.9261H3.50549C3.50549 9.10314 5.13554 7.51846 7.28388 7.51846V6.01846ZM7.28388 7.51846H8.41597V6.01846H7.28388V7.51846ZM20.869 6.01846H19.7369V7.51846H20.869V6.01846Z"
               fill="#797C7B"
            />
            <Ellipse cx="14.0764" cy="6.76847" rx="1.1321" ry="1.03941" fill="#797C7B" />
         </Svg>
      ),
   },
   {
      text: "Documents",
      subtext: "Share your files",
      icon: (
         <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
            <Path
               d="M15.2085 2.92117V7.07881C15.2085 9.37501 17.236 11.2364 19.7369 11.2364L24.2653 11.2364M3.88757 7.07881L3.88757 19.5517C3.88757 21.8479 5.915 23.7094 8.41596 23.7094H19.7369C22.2379 23.7094 24.2653 21.8479 24.2653 19.5517V12.9586C24.2653 11.8559 23.7882 10.7984 22.939 10.0187L16.5349 4.13892C15.6856 3.35921 14.5338 2.92117 13.3328 2.92117L8.41596 2.92117C5.915 2.92117 3.88757 4.78261 3.88757 7.07881Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinejoin="round"
            />
         </Svg>
      ),
   },
   {
      text: "Create a poll",
      subtext: "Create a poll for any query",
      icon: (
         <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
            <Path
               fillRule="evenodd"
               clipRule="evenodd"
               d="M24.2653 20.4803C24.2653 21.3087 23.5937 21.9803 22.7653 21.9803L21.2369 21.9803C20.4084 21.9803 19.7369 21.3087 19.7369 20.4803L19.7369 4.77093C19.7369 3.9425 20.4084 3.27093 21.2369 3.27093L22.7653 3.27093C23.5937 3.27093 24.2653 3.9425 24.2653 4.77093L24.2653 20.4803Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
            <Path
               fillRule="evenodd"
               clipRule="evenodd"
               d="M16.3406 20.4805C16.3406 21.309 15.6691 21.9805 14.8406 21.9805L13.3123 21.9805C12.4838 21.9805 11.8123 21.309 11.8123 20.4805L11.8123 10.6792C11.8123 9.85074 12.4838 9.17917 13.3123 9.17917L14.8406 9.17917C15.6691 9.17917 16.3406 9.85074 16.3406 10.6792L16.3406 20.4805Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
            <Path
               fillRule="evenodd"
               clipRule="evenodd"
               d="M8.41595 20.4807C8.41595 21.3091 7.74438 21.9807 6.91595 21.9807L5.38757 21.9807C4.55914 21.9807 3.88757 21.3091 3.88757 20.4807L3.88757 16.5874C3.88757 15.7589 4.55914 15.0874 5.38757 15.0874L6.91595 15.0874C7.74438 15.0874 8.41595 15.7589 8.41595 16.5874L8.41595 20.4807Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
         </Svg>
      ),
   },
   {
      text: "Media",
      subtext: "Share photos and videos",
      icon: (
         <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
            <Path
               d="M25.3974 15.0148L22.0702 12.8153C20.3412 11.6724 17.9784 11.7905 16.3949 13.099L11.758 16.9305C10.1745 18.239 7.81166 18.3572 6.08273 17.2143L2.75549 15.0148M7.28388 23.33H20.869C23.37 23.33 25.3974 21.4686 25.3974 19.1724V6.69951C25.3974 4.40331 23.37 2.54187 20.869 2.54187H7.28388C4.78292 2.54187 2.75549 4.40331 2.75549 6.69951V19.1724C2.75549 21.4686 4.78292 23.33 7.28388 23.33ZM12.9444 9.29803C12.9444 10.7332 11.6772 11.8966 10.1141 11.8966C8.55102 11.8966 7.28388 10.7332 7.28388 9.29803C7.28388 7.8629 8.55102 6.69951 10.1141 6.69951C11.6772 6.69951 12.9444 7.8629 12.9444 9.29803Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
            />
         </Svg>
      ),
   },
   {
      text: "Contact",
      subtext: "Share your contacts",
      icon: (
         <Svg width="26" height="24" viewBox="0 0 26 24" fill="none">
            <Ellipse
               cx="12.944"
               cy="12"
               rx="10.64"
               ry="10"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinejoin="round"
            />
            <Path
               d="M18.264 17C16.6878 15.7256 14.874 15 12.944 15C11.014 15 9.20022 15.7256 7.62402 17"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
            <Ellipse
               cx="3.192"
               cy="3"
               rx="3.192"
               ry="3"
               transform="matrix(1 0 0 -1 9.75201 12)"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinejoin="round"
            />
         </Svg>
      ),
   },
   {
      text: "Location",
      subtext: "Share your location",
      icon: (
         <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
            <Path
               fillRule="evenodd"
               clipRule="evenodd"
               d="M14.0764 13.5961V13.5961C12.2005 13.5961 10.6801 12.2001 10.6801 10.4778V10.4778C10.6801 8.75555 12.2005 7.35962 14.0764 7.35962V7.35962C15.9523 7.35962 17.4727 8.75555 17.4727 10.4778V10.4778C17.4727 12.2001 15.9523 13.5961 14.0764 13.5961Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
            <Path
               fillRule="evenodd"
               clipRule="evenodd"
               d="M14.7806 21.3464C14.3687 21.689 13.7841 21.689 13.3722 21.3464C11.432 19.7328 6.15173 14.9322 6.15173 10.4778C6.15173 6.45947 9.69972 3.20197 14.0764 3.20197C18.4531 3.20197 22.0011 6.45947 22.0011 10.4778C22.0011 14.9322 16.7208 19.7328 14.7806 21.3464Z"
               stroke="#797C7B"
               strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
         </Svg>
      ),
   },
];

const ChatScreen = () => {
   return (
      <View style={styles.container}>
         {/* Header */}
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
                     d="M12.5 11C12.2237 11 11.9588 11.1054 11.7634 11.2929C11.5681 11.4804 11.4583 11.7348 11.4583 12V16C11.4583 16.2652 11.5681 16.5196 11.7634 16.7071C11.9588 16.8946 12.2237 17 12.5 17C12.7763 17 13.0412 16.8946 13.2366 16.7071C13.4319 16.5196 13.5417 16.2652 13.5417 16V12C13.5417 11.7348 13.4319 11.4804 13.2366 11.2929C13.0412 11.1054 12.7763 11 12.5 11ZM12.8958 7.08C12.6422 6.97998 12.3578 6.97998 12.1042 7.08C11.9763 7.12759 11.8595 7.19896 11.7604 7.29C11.6684 7.3872 11.5944 7.49881 11.5417 7.62C11.4833 7.73868 11.4548 7.86882 11.4583 8C11.4575 8.13161 11.4838 8.26207 11.5356 8.38391C11.5875 8.50574 11.6639 8.61656 11.7604 8.71C11.8617 8.79833 11.9779 8.86936 12.1042 8.92C12.262 8.98224 12.4333 9.00632 12.6031 8.99011C12.7728 8.97391 12.9359 8.91792 13.0778 8.82707C13.2198 8.73622 13.3363 8.61328 13.4172 8.46907C13.4981 8.32486 13.5408 8.16378 13.5417 8C13.5378 7.73523 13.4299 7.48163 13.2396 7.29C13.1405 7.19896 13.0237 7.12759 12.8958 7.08ZM12.5 2C10.4398 2 8.42581 2.58649 6.71279 3.6853C4.99978 4.78412 3.66465 6.3459 2.87624 8.17317C2.08783 10.0004 1.88154 12.0111 2.28347 13.9509C2.6854 15.8907 3.67749 17.6725 5.13429 19.0711C6.59109 20.4696 8.44716 21.422 10.4678 21.8079C12.4884 22.1937 14.5829 21.9957 16.4863 21.2388C18.3897 20.4819 20.0165 19.2002 21.1611 17.5557C22.3057 15.9112 22.9167 13.9778 22.9167 12C22.9167 10.6868 22.6472 9.38642 22.1237 8.17317C21.6002 6.95991 20.833 5.85752 19.8657 4.92893C18.8984 4.00035 17.7501 3.26375 16.4863 2.7612C15.2225 2.25866 13.8679 2 12.5 2V2ZM12.5 20C10.8518 20 9.24064 19.5308 7.87023 18.6518C6.49982 17.7727 5.43172 16.5233 4.80099 15.0615C4.17026 13.5997 4.00523 11.9911 4.32677 10.4393C4.64832 8.88743 5.44199 7.46197 6.60743 6.34315C7.77287 5.22433 9.25772 4.4624 10.8742 4.15372C12.4907 3.84504 14.1663 4.00346 15.689 4.60896C17.2117 5.21447 18.5132 6.23984 19.4289 7.55544C20.3446 8.87103 20.8333 10.4177 20.8333 12C20.8333 14.1217 19.9553 16.1566 18.3925 17.6569C16.8297 19.1571 14.7101 20 12.5 20V20Z"
                     fill="white"
                  />
               </Svg>
            </View>
         </View>

         {/* Chat Messages */}
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
         </ScrollView>

         {/* Input Section */}
         <View style={styles.inputSection}>
            <View style={styles.inputField}>
               <TextInput style={styles.input} placeholder="Write your message" />
            </View>
         </View>

         {/* Share Content Modal */}
         <View style={styles.shareContent}>
            <View style={styles.relative}>
               <Text style={styles.modalTitle}>Share Content</Text>
               <TouchableOpacity style={styles.closeBtn}>
                  <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
                     <Path
                        d="M19.4159 7.67984L8.09497 18.0739M19.4159 18.0738L8.09497 7.67978"
                        stroke="#000E08"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                     />
                  </Svg>
               </TouchableOpacity>
            </View>

            {items.map((item, index) => (
               <View style={styles.item} key={index}>
                  <View style={styles.iconContainer}>{item.icon}</View>
                  <View style={styles.textContainer}>
                     <Text style={styles.text}>{item.text}</Text>
                     {item.subtext && <Text style={styles.subtext}>{item.subtext}</Text>}
                  </View>
               </View>
            ))}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   text: {
      fontWeight: "600",
      fontSize: 16,
   },
   subtext: {
      color: "#797c7b",
      fontWeight: "400",
      fontSize: 14,
   },
   container: {
      flex: 1,
      backgroundColor: "#242c3b",
      borderRadius: 20,
      width: width, // Dynamically setting width based on device width
      height: height, // Dynamically setting height based on device height
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
   voiceMessage: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 10,
      borderRadius: 10,
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
   },
   inputField: {
      flex: 1,
      backgroundColor: "#f3f6f6",
      borderRadius: 100,
      paddingHorizontal: 10,
      height: 40,
      justifyContent: "center",
   },
   input: {
      flex: 1,
      fontSize: 14,
   },
   shareContent: {
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 20,
      position: "absolute",
      top: 100,
      left: 0,
      right: 0,
      marginHorizontal: "auto",
   },
   relative: {
      position: "relative",
   },
   modalTitle: {
      fontSize: 16,
      textAlign: "center",
   },
   closeBtn: {
      position: "absolute",
      top: -5,
      left: 0,
   },
   item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
   },
   iconContainer: {
      backgroundColor: "#f2f8f7",
      width: 55,
      height: 55,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 100,
   },
   textContainer: {
      flexDirection: "column",
      gap: 2,
   },
   itemText: {
      fontWeight: "600",
   },
});

export default ChatScreen;
