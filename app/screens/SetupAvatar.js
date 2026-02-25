// Separate file to avoid hooks-in-render issue
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const SKIN_TONES = ['#FDDBB4','#F5C89A','#E8A87C','#C68642','#8D5524','#4A2912'];
const HAIR_COLORS = ['#1a1a1a','#4a3728','#8B4513','#D4A017','#E8C99A','#FF6B6B','#4ECDC4'];
const HAIR_STYLES = ['short','medium','long','curly','bun','none'];
const HAIR_LABELS = ['Short','Medium','Long','Curly','Bun','Bald'];
const FACIAL_HAIR = ['none','stubble','beard','mustache'];
const FACIAL_LABELS = ['None','Stubble','Beard','Mustache'];
const ACCESSORIES = ['none','headband','cap','sunglasses'];
const ACC_LABELS = ['None','Headband','Cap','Shades'];

export function AvatarPreview({ config, size = 120 }) {
    const s = size, skin = config.skinTone, hair = config.hairColor;
    return (
        <View style={{ width: s, height: s * 1.1, alignItems: 'center' }}>
            <View style={{ position:'absolute', bottom: s*0.18, width: s*0.22, height: s*0.18, backgroundColor: skin, borderRadius: 4, zIndex: 1 }} />
            <LinearGradient colors={['#16a34a','#15803d']} style={{ position:'absolute', bottom: 0, width: s*0.85, height: s*0.28, borderRadius: s*0.1, alignItems:'center' }}>
                <View style={{ width: s*0.18, height: s*0.08, backgroundColor: '#fff', borderBottomLeftRadius: s*0.05, borderBottomRightRadius: s*0.05 }} />
            </LinearGradient>
            <View style={{ position:'absolute', top: s*0.02, width: s*0.6, height: s*0.65, backgroundColor: skin, borderRadius: s*0.32, zIndex: 2, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:6 }}>
                <View style={{ position:'absolute', left: -s*0.04, top: s*0.28, width: s*0.08, height: s*0.12, backgroundColor: skin, borderRadius: s*0.04 }} />
                <View style={{ position:'absolute', right: -s*0.04, top: s*0.28, width: s*0.08, height: s*0.12, backgroundColor: skin, borderRadius: s*0.04 }} />
                <View style={{ position:'absolute', top: s*0.26, left: s*0.1, width: s*0.12, height: s*0.08, backgroundColor:'#1a1a2e', borderRadius: s*0.04 }}>
                    <View style={{ position:'absolute', top: 1, right: 1, width: s*0.03, height: s*0.03, backgroundColor:'#fff', borderRadius: 99 }} />
                </View>
                <View style={{ position:'absolute', top: s*0.26, right: s*0.1, width: s*0.12, height: s*0.08, backgroundColor:'#1a1a2e', borderRadius: s*0.04 }}>
                    <View style={{ position:'absolute', top: 1, right: 1, width: s*0.03, height: s*0.03, backgroundColor:'#fff', borderRadius: 99 }} />
                </View>
                <View style={{ position:'absolute', top: s*0.38, alignSelf:'center', width: s*0.06, height: s*0.08, borderBottomWidth: 2, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor:`${skin}88`, borderRadius: 4 }} />
                <View style={{ position:'absolute', top: s*0.5, alignSelf:'center', width: s*0.18, height: s*0.04, borderBottomWidth: 2, borderColor:'#c0707080', borderRadius: 99 }} />
                {config.facialHair==='stubble'&&<View style={{ position:'absolute', top: s*0.46, alignSelf:'center', width: s*0.28, height: s*0.1, backgroundColor:'#00000022', borderRadius: 4 }} />}
                {config.facialHair==='mustache'&&<View style={{ position:'absolute', top: s*0.44, alignSelf:'center', width: s*0.2, height: s*0.05, backgroundColor:'#00000055', borderRadius: 8 }} />}
                {config.facialHair==='beard'&&<View style={{ position:'absolute', top: s*0.44, alignSelf:'center', width: s*0.34, height: s*0.18, backgroundColor:`${hair}99`, borderRadius: 8, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }} />}
            </View>
            {config.hairStyle!=='none'&&(
                <View style={{ position:'absolute', top: 0, zIndex: 3, alignItems:'center', width: s*0.6 }}>
                    {config.hairStyle==='short'&&<View style={{ width: s*0.6, height: s*0.22, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3, borderBottomLeftRadius: s*0.04, borderBottomRightRadius: s*0.04 }} />}
                    {config.hairStyle==='medium'&&<><View style={{ width: s*0.6, height: s*0.22, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} /><View style={{ position:'absolute', top: s*0.12, left:-s*0.02, width: s*0.1, height: s*0.28, backgroundColor: hair, borderRadius: 4 }} /><View style={{ position:'absolute', top: s*0.12, right:-s*0.02, width: s*0.1, height: s*0.28, backgroundColor: hair, borderRadius: 4 }} /></>}
                    {config.hairStyle==='long'&&<><View style={{ width: s*0.6, height: s*0.2, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} /><View style={{ position:'absolute', top: s*0.1, left:-s*0.02, width: s*0.1, height: s*0.5, backgroundColor: hair, borderRadius: 4 }} /><View style={{ position:'absolute', top: s*0.1, right:-s*0.02, width: s*0.1, height: s*0.5, backgroundColor: hair, borderRadius: 4 }} /></>}
                    {config.hairStyle==='curly'&&<View style={{ width: s*0.68, height: s*0.3, backgroundColor: hair, borderRadius: s*0.15, marginTop: -s*0.04 }} />}
                    {config.hairStyle==='bun'&&<><View style={{ width: s*0.6, height: s*0.18, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} /><View style={{ position:'absolute', top:-s*0.06, width: s*0.18, height: s*0.18, backgroundColor: hair, borderRadius: s*0.09 }} /></>}
                </View>
            )}
            {config.accessory==='headband'&&<View style={{ position:'absolute', top: s*0.2, zIndex: 4, width: s*0.62, height: s*0.07, backgroundColor:'#e94560', borderRadius: 4 }} />}
            {config.accessory==='cap'&&<View style={{ position:'absolute', top: -s*0.02, zIndex: 4, alignItems:'center' }}><View style={{ width: s*0.66, height: s*0.2, backgroundColor:'#1a1a2e', borderTopLeftRadius: s*0.33, borderTopRightRadius: s*0.33 }} /><View style={{ marginTop:-s*0.02, width: s*0.78, height: s*0.07, backgroundColor:'#1a1a2e', borderRadius: 4 }} /></View>}
            {config.accessory==='sunglasses'&&<View style={{ position:'absolute', top: s*0.26, zIndex: 4, flexDirection:'row', alignItems:'center', gap: 2 }}><View style={{ width: s*0.16, height: s*0.1, backgroundColor:'#1a1a2e', borderRadius: 4, opacity:0.85 }} /><View style={{ width: s*0.06, height: s*0.02, backgroundColor:'#1a1a2e' }} /><View style={{ width: s*0.16, height: s*0.1, backgroundColor:'#1a1a2e', borderRadius: 4, opacity:0.85 }} /></View>}
        </View>
    );
}

export default function StepAvatar({ formData, update }) {
    const [tab, setTab] = useState('avatar');
    const av = formData.avatar;

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={s.stepTitle}>Your look</Text>
            <Text style={s.stepSub}>Build an avatar or upload a photo — changeable anytime</Text>

            <View style={s.tabSwitch}>
                <TouchableOpacity style={[s.tabBtn, tab==='avatar'&&s.tabBtnActive]} onPress={()=>setTab('avatar')}>
                    <Text style={[s.tabBtnText, tab==='avatar'&&s.tabBtnTextActive]}>Build Avatar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.tabBtn, tab==='photo'&&s.tabBtnActive]} onPress={()=>setTab('photo')}>
                    <Text style={[s.tabBtnText, tab==='photo'&&s.tabBtnTextActive]}>Upload Photo</Text>
                </TouchableOpacity>
            </View>

            {tab === 'avatar' && (
                <View style={{ alignItems:'center' }}>
                    <View style={s.previewBox}><AvatarPreview config={av} size={140} /></View>
                    <Text style={s.optLabel}>Skin Tone</Text>
                    <View style={s.colorRow}>
                        {SKIN_TONES.map(t=><TouchableOpacity key={t} onPress={()=>update({avatar:{...av,skinTone:t}})} style={[s.dot,{backgroundColor:t},av.skinTone===t&&s.dotSel]}/>)}
                    </View>
                    <Text style={s.optLabel}>Hair Style</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
                        <View style={{flexDirection:'row',gap:8,paddingHorizontal:20}}>
                            {HAIR_STYLES.map((hs,i)=><TouchableOpacity key={hs} onPress={()=>update({avatar:{...av,hairStyle:hs}})} style={[s.chip,av.hairStyle===hs&&s.chipActive]}><Text style={[s.chipText,av.hairStyle===hs&&s.chipTextActive]}>{HAIR_LABELS[i]}</Text></TouchableOpacity>)}
                        </View>
                    </ScrollView>
                    {av.hairStyle!=='none'&&<>
                        <Text style={s.optLabel}>Hair Color</Text>
                        <View style={s.colorRow}>
                            {HAIR_COLORS.map(c=><TouchableOpacity key={c} onPress={()=>update({avatar:{...av,hairColor:c}})} style={[s.dot,{backgroundColor:c},av.hairColor===c&&s.dotSel]}/>)}
                        </View>
                    </>}
                    <Text style={s.optLabel}>Facial Hair</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
                        <View style={{flexDirection:'row',gap:8,paddingHorizontal:20}}>
                            {FACIAL_HAIR.map((f,i)=><TouchableOpacity key={f} onPress={()=>update({avatar:{...av,facialHair:f}})} style={[s.chip,av.facialHair===f&&s.chipActive]}><Text style={[s.chipText,av.facialHair===f&&s.chipTextActive]}>{FACIAL_LABELS[i]}</Text></TouchableOpacity>)}
                        </View>
                    </ScrollView>
                    <Text style={s.optLabel}>Accessory</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
                        <View style={{flexDirection:'row',gap:8,paddingHorizontal:20}}>
                            {ACCESSORIES.map((a,i)=><TouchableOpacity key={a} onPress={()=>update({avatar:{...av,accessory:a}})} style={[s.chip,av.accessory===a&&s.chipActive]}><Text style={[s.chipText,av.accessory===a&&s.chipTextActive]}>{ACC_LABELS[i]}</Text></TouchableOpacity>)}
                        </View>
                    </ScrollView>
                </View>
            )}
            {tab === 'photo' && (
                <View style={{alignItems:'center',paddingTop:20}}>
                    <TouchableOpacity style={s.photoBox} onPress={async()=>{
                        const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,allowsEditing:true,aspect:[1,1],quality:0.8});
                        if(!r.canceled) update({photo:r.assets[0].uri});
                    }}>
                        {formData.photo
                            ?<Image source={{uri:formData.photo}} style={{width:140,height:140,borderRadius:70}}/>
                            :<><Ionicons name="camera-outline" size={40} color="#bbb"/><Text style={{color:'#bbb',marginTop:8}}>Tap to choose photo</Text></>
                        }
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    stepTitle:{fontSize:26,fontWeight:'900',color:'#1a1a2e',marginBottom:6,marginTop:8},
    stepSub:{fontSize:13,color:'#aaa',marginBottom:20,lineHeight:19},
    tabSwitch:{flexDirection:'row',backgroundColor:'#f8f9fb',borderRadius:12,padding:4,marginBottom:20},
    tabBtn:{flex:1,paddingVertical:10,alignItems:'center',borderRadius:10},
    tabBtnActive:{backgroundColor:'#fff',shadowColor:'#000',shadowOpacity:0.08,shadowRadius:4,elevation:2},
    tabBtnText:{fontSize:14,fontWeight:'600',color:'#999'},
    tabBtnTextActive:{color:'#1a1a2e'},
    previewBox:{width:180,height:200,backgroundColor:'#f0fdf4',borderRadius:90,justifyContent:'center',alignItems:'center',marginBottom:24,borderWidth:3,borderColor:'#86efac'},
    colorRow:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',marginBottom:16},
    dot:{width:34,height:34,borderRadius:17},
    dotSel:{borderWidth:3,borderColor:'#16a34a',transform:[{scale:1.15}]},
    optLabel:{fontSize:12,fontWeight:'700',color:'#999',textTransform:'uppercase',letterSpacing:1,marginBottom:8,alignSelf:'flex-start',paddingLeft:20},
    chip:{paddingHorizontal:16,paddingVertical:9,backgroundColor:'#f8f9fb',borderRadius:20,borderWidth:1.5,borderColor:'#f0f0f0'},
    chipActive:{backgroundColor:'#16a34a',borderColor:'#16a34a'},
    chipText:{fontSize:13,fontWeight:'600',color:'#555'},
    chipTextActive:{color:'#fff'},
    photoBox:{width:160,height:160,borderRadius:80,backgroundColor:'#f8f9fb',borderWidth:2,borderColor:'#e0e0e0',borderStyle:'dashed',justifyContent:'center',alignItems:'center'},
});