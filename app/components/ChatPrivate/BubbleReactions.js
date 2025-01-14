import {Text, View} from "react-native";

function BubbleReactions({me, reactions}) {
	return (
		<View
			className={`absolute -bottom-1 bg-gray-100 justify-center items-center
									px-2 py-1 border-2 border-white rounded-full ${me ? 'left-0' : 'right-0'}`}
			style={{transform: [{translateX: me ? -20 : 20}, {translateY: 15}]}}>
			{reactions.length < 2 ? (<Text className="font-rubik text-2xs text-black">{reactions[0].reactionType}</Text>)
				: (<View className={"flex-row"}>
					{reactions.map((reaction, index) => {
						if (reaction.reactionType === reactions[0].reactionType && index === 1) return;
						return <Text key={index} className="font-rubik text-2xs text-black">{reaction.reactionType}</Text>;
					})}
					<Text className="font-rubik text-2xs text-black">{" " + reactions.length}</Text>
				</View>)}
		</View>
	);
}

export default BubbleReactions;
