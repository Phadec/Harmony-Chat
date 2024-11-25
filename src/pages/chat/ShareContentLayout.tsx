import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Svg, Path, Ellipse } from 'react-native-svg';

const ShareContentScreen = () => {
  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <View style={styles.relative}>
          <Text style={styles.title}>Share Content</Text>
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
        <ScrollView>
          {items.map((item, index) => (
            <View style={styles.item} key={index}>
              <View style={styles.iconContainer}>{item.icon}</View>
              <View style={styles.textContainer}>
                <Text style={styles.text}>{item.text}</Text>
                {item.subtext && <Text style={styles.subtext}>{item.subtext}</Text>}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const items = [
  {
    text: 'Camera',
    icon: (
      <Svg width="28" height="26" viewBox="0 0 28 26" fill="none">
        <Path
          d="M8.41597 6.76846V7.51846C8.65613 7.51846 8.88176 7.40346 9.02286 7.20913L8.41597 6.76846ZM10.008 4.57593L9.40112 4.13527V4.13527L10.008 4.57593ZM18.1449 4.57594L18.7518 4.13527L18.1449 4.57594ZM19.7369 6.76846L19.13 7.20913C19.2712 7.40346 19.4968 7.51846 19.7369 7.51846V6.76846ZM16.7227 14.564C16.7227 15.8129 15.5996 16.9323 14.0765 16.9323V18.4323C16.3048 18.4323 18.2227 16.7594 18.2227 14.564H16.7227ZM14.0765 16.9323C12.5534 16.9323 11.4302 15.8129 11.4302 14.564H9.93017C9.93017 16.7594 11.8481 18.4323 14.0765 18.4323V16.9323ZM11.4302 14.564C11.4302 13.3151 12.5534 12.1958 14.0765 12.1958V10.6958C11.8481 10.6958 9.93017 12.3686 9.93017 14.564H11.4302ZM14.0765 12.1958C15.5996 12.1958 16.7227 13.3151 16.7227 14.564H18.2227C18.2227 12.3686 16.3048 10.6958 14.0765 10.6958V12.1958ZM9.02286 7.20913L10.6149 5.0166L9.40112 4.13527L7.80909 6.3278L9.02286 7.20913ZM11.8919 4.40024H16.261V2.90024H11.8919V4.40024ZM17.538 5.0166L19.13 7.20913L20.3438 6.3278L18.7518 4.13527L17.538 5.0166ZM16.261 4.40024C16.7946 4.40024 17.2687 4.64573 17.538 5.0166L18.7518 4.13527C18.1812 3.34949 17.2415 2.90024 16.261 2.90024V4.40024ZM10.6149 5.0166C10.8842 4.64573 11.3583 4.40024 11.8919 4.40024V2.90024C10.9114 2.90024 9.97168 3.34949 9.40112 4.13527L10.6149 5.0166ZM24.6474 10.9261V18.202H26.1474V10.9261H24.6474ZM20.869 21.6096H7.28388V23.1096H20.869V21.6096ZM3.50549 18.202V10.9261H2.00549V18.202H3.50549ZM7.28388 21.6096C5.13554 21.6096 3.50549 20.0249 3.50549 18.202H2.00549C2.00549 20.9714 4.4303 23.1096 7.28388 23.1096V21.6096ZM24.6474 18.202C24.6474 20.0249 23.0174 21.6096 20.869 21.6096V23.1096C23.7226 23.1096 26.1474 20.9714 26.1474 18.202H24.6474ZM20.869 7.51846C23.0174 7.51846 24.6474 9.10314 24.6474 10.9261H26.1474C26.1474 8.15667 23.7226 6.01846 20.869 6.01846V7.51846ZM7.28388 6.01846C4.4303 6.01846 2.00549 8.15667 2.00549 10.9261H3.50549C3.50549 9.10314 5.13554 7.51846 7.28388 7.51846V6.01846ZM7.28388 7.51846H8.41597V6.01846H7.28388V7.51846ZM20.869 6.01846H19.7369V7.51846H20.869V6.01846Z"
          fill="#797C7B"
        />
        <Ellipse
          cx="14.0764"
          cy="6.76847"
          rx="1.1321"
          ry="1.03941"
          fill="#797C7B"
        />
      </Svg>
    ),
  },
  {
    text: 'Documents',
    subtext: 'Share your files',
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
    text: 'Create a poll',
    subtext: 'Create a poll for any query',
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
    text: 'Media',
    subtext: 'Share photos and videos',
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
    text: 'Contact',
    subtext: 'Share your contacts',
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
    text: 'Location',
    subtext: 'Share your location',
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

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  relative: {
    position: 'relative',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: -5,
    left: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconContainer: {
    backgroundColor: '#f2f8f7',
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  textContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  subtext: {
    color: '#797c7b',
    fontWeight: '400',
    fontSize: 14,
  },
});

export default ShareContentScreen;
