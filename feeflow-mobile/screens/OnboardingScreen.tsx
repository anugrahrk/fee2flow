import { View, Text, TouchableOpacity, StatusBar, Image, Animated, FlatList, useWindowDimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useState, useRef } from 'react';

type Props = {
    navigation: any;
};

const pages = [
    {
        id: '1',
        title: 'Collect fees\nwith no hustle',
        subtitle: 'Move from manual chaos to lightning-fast digital payments in seconds.',
        type: 'video',
        source: require('../assets/video.mp4'),
        hasInfoCard: true,
        titleFirst: true,
    },
    {
        id: '2',
        title: 'Automated Reminders,\nto keep your mindpeace',
        subtitle: "Set it and forget it. We'll handle the gentle nudges so you can focus on what matters.",
        type: 'image',
        source: require('../assets/male_mannequin_coin.png'),
        hasInfoCard: false,
        titleFirst: false,
    },
    {
        id: '3',
        title: 'Military-grade Security',
        subtitle: 'Your assets are protected by world-class encryption and decentralized security protocols.',
        type: 'image',
        source: require('../assets/security_globe.png'),
        hasInfoCard: false,
        titleFirst: false,
    }
];

export default function OnboardingScreen({ navigation }: Props) {
    const { width } = useWindowDimensions();
    const videoRef = useRef<Video>(null);
    const [hasFinished, setHasFinished] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);
    
    // Animation value for the button fill effect
    const fillAnimation = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.timing(fillAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(fillAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleNext = () => {
        if (currentIndex < pages.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.navigate('OpeningScreen');
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            slidesRef.current?.scrollToIndex({ index: currentIndex - 1 });
        }
    };

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        return (
            <View style={{ width }}>
                {item.titleFirst ? (
                    <>
                        <View className="px-6 mt-20">
                            <Text className="text-white font-bold text-[44px] leading-[48px] tracking-tight">
                                {item.title}
                            </Text>
                            <Text className="text-gray-400 text-lg mt-4 leading-6 pr-4">
                                {item.subtitle}
                            </Text>
                        </View>
                        <View className="px-6 mt-10">
                            <View className="rounded-[24px] overflow-hidden bg-[#131b2f] border border-gray-800 relative items-center justify-center" style={{ height: 240 }}>
                                <Video
                                    ref={videoRef}
                                    style={{ width: '100%', height: '100%' }}
                                    source={item.source}
                                    useNativeControls={false}
                                    resizeMode={ResizeMode.COVER}
                                    isLooping={false}
                                    shouldPlay={currentIndex === 0}
                                    isMuted={true}
                                    onPlaybackStatusUpdate={(status: any) => {
                                        if (status.isLoaded && status.didJustFinish) {
                                            setHasFinished(true);
                                        }
                                    }}
                                />
                                {hasFinished && (
                                    <View className="absolute inset-0 bg-black/50 items-center justify-center z-10">
                                        <TouchableOpacity 
                                            className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center shadow-lg"
                                            onPress={() => {
                                                setHasFinished(false);
                                                videoRef.current?.replayAsync();
                                            }}
                                        >
                                            <View className="ml-1 w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                        {item.hasInfoCard && (
                            <View className="px-6 mt-5">
                                <View className="flex-row items-center bg-[#131b2f] rounded-2xl p-4 border border-gray-800">
                                    <View className="w-12 h-12 bg-[#1a2542] rounded-xl items-center justify-center mr-4 border border-[#23315a]">
                                        <Text className="text-blue-400 text-xl">⏱</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white text-lg font-semibold">Instant Settlements</Text>
                                        <Text className="text-gray-400 text-sm mt-1">No more waiting for days to get paid.</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <View className="px-6 mt-16">
                            <View className="rounded-[24px] overflow-hidden bg-[#131b2f] border border-gray-800 relative items-center justify-center" style={{ height: 280 }}>
                                <Image
                                    source={item.source}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </View>
                        </View>
                        <View className="px-6 mt-10">
                            <Text className="text-white font-bold text-[45px] text-center mb-4 leading-[44px]">
                                {item.title}
                            </Text>
                            <Text className="text-gray-400 text-base text-center leading-6 px-4 mt-4">
                                {item.subtitle}
                            </Text>
                        </View>
                    </>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#0b101e]">
            <StatusBar barStyle="light-content" />
            
            {/* Header - Stays common */}
            <View className="flex-row items-center justify-between px-6 pt-16">
                <View className="flex-row items-center gap-2">
                    {currentIndex > 0 && (
                        <TouchableOpacity onPress={handleBack} className="mr-2">
                            <Text className="text-white text-2xl font-bold">←</Text>
                        </TouchableOpacity>
                    )}
                    <View className="w-8 h-6 mb-2">
                        <Image
                            source={require('../assets/logo.png')}
                            style={{ width: 32, height: 32 }}
                            resizeMode='contain'
                        />
                    </View>
                    <Text className="text-white text-xl font-bold tracking-widest pt-1 pl-2">FEE<Text className='text-blue-500'>2</Text>FLOW</Text>
                </View>
                {/* <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-gray-400 text-base">Skip</Text>
                </TouchableOpacity> */}
            </View>

            {/* Swipable Content */}
            <View style={{ flex: 1 }}>
                <FlatList
                    data={pages}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            {/* Footer - Stays common */}
            <View className="px-6 pb-12 pt-4 mb-14">
                {/* Pagination Indicator */}
                <View className="flex-row justify-center mb-8 gap-2">
                    {pages.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [6, 32, 6],
                            extrapolate: 'clamp',
                        });
                        const backgroundColor = scrollX.interpolate({
                            inputRange,
                            outputRange: ['#374151', '#529afc', '#374151'], // gray-700 to blue and back
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={{
                                    width: dotWidth,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor,
                                }}
                            />
                        );
                    })}
                </View>

                {/* Next/Finish Button */}
                <TouchableOpacity
                    activeOpacity={1}
                    className="w-full bg-[#529afc] rounded-2xl h-14 overflow-hidden relative justify-center items-center"
                    onPress={handleNext}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                >
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            backgroundColor: '#1e3a8a',
                            width: fillAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            })
                        }}
                    />
                    <View className="flex-row items-center z-10 pointer-events-none">
                        <Text className="text-white text-lg font-semibold mr-2">
                            {currentIndex === pages.length - 1 ? 'Finish' : 'Next'}
                        </Text>
                        <Text className="text-white text-lg mb-2">→</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}