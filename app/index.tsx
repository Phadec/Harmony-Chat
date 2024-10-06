import React from "react";
import { useState } from "react";
import { Button, StyleSheet,Text, TextInput, View } from "react-native";

export default function App() {
  const [text, setText] = useState('')   // Quản lý nội dung nhập
  const [data, setData] = useState<string[]>([])   // Dữ liệu todo lưu trữ dưới dạng mảng chuỗi

  const pressBtn = () => {
    if (text.trim()) {   // Kiểm tra nếu có nội dung hợp lệ trong input
      setData([...data, text])   // Cập nhật dữ liệu todo
      setText('')   // Xóa nội dung input sau khi thêm
    }
  }

  return (
    <View>
      <View>
        <TextInput
          value={text}   // Liên kết giá trị của input với trạng thái `text`
          onChangeText={setText}   // Cập nhật `text` khi có sự thay đổi trong input
          placeholder="Enter todo"   // Gợi ý nội dung nhập
        />
        <Button title="Add" onPress={pressBtn} />   // Gọi hàm pressBtn khi nhấn nút
      </View>
      <View>
        {
          data.map((item, index) => (   // Hiển thị từng todo trong mảng
            <Text key={index}>{item}</Text>   // Sử dụng `index` làm key
          ))
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
