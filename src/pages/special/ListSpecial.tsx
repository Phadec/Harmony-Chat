import { specials } from "~/common/Data";

import { FlatList, Text, View } from "react-native";
import { flatStyle } from "~/common/Styles";
import SpecialItem from "./SpecialItem";


const RecentList: React.FC = () => {
   return (
    <View style={flatStyle.containerFlat}>
      <Text style={flatStyle.recentCallText}>Recent</Text>
      <FlatList
        data={specials}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SpecialItem item={item} />}
        contentContainerStyle={flatStyle.flatList}
        showsVerticalScrollIndicator={false} 
        scrollEnabled={true} 
      />
    </View>
   )
};


export default RecentList;
