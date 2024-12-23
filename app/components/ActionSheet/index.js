import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

function ActionSheet({ visible, onClose, actions }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        {actions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                className="flex-row items-center py-4"
                                onPress={action.onPress}
                            >
                                {action.icon}
                                <Text className="font-rubik text-base ml-3">{action.title}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            className="mt-2 py-4 items-center border-t border-gray-200"
                            onPress={onClose}
                        >
                            <Text className="font-rubik text-base text-red">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

export default ActionSheet; 