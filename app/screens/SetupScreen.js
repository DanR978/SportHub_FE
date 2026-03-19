import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Animated, Dimensions, ScrollView,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signupWithEmail } from '../services/auth';
import StepAvatar from './SetupAvatar';

const { width, height } = Dimensions.get('window');

const COUNTRIES = [
    {name:'Afghanistan',flag:'🇦🇫'},{name:'Albania',flag:'🇦🇱'},{name:'Algeria',flag:'🇩🇿'},
    {name:'Argentina',flag:'🇦🇷'},{name:'Australia',flag:'🇦🇺'},{name:'Austria',flag:'🇦🇹'},
    {name:'Belgium',flag:'🇧🇪'},{name:'Bolivia',flag:'🇧🇴'},{name:'Brazil',flag:'🇧🇷'},
    {name:'Canada',flag:'🇨🇦'},{name:'Chile',flag:'🇨🇱'},{name:'China',flag:'🇨🇳'},
    {name:'Colombia',flag:'🇨🇴'},{name:'Costa Rica',flag:'🇨🇷'},{name:'Croatia',flag:'🇭🇷'},
    {name:'Cuba',flag:'🇨🇺'},{name:'Czech Republic',flag:'🇨🇿'},{name:'Denmark',flag:'🇩🇰'},
    {name:'Dominican Republic',flag:'🇩🇴'},{name:'Ecuador',flag:'🇪🇨'},{name:'Egypt',flag:'🇪🇬'},
    {name:'El Salvador',flag:'🇸🇻'},{name:'Ethiopia',flag:'🇪🇹'},{name:'Finland',flag:'🇫🇮'},
    {name:'France',flag:'🇫🇷'},{name:'Germany',flag:'🇩🇪'},{name:'Ghana',flag:'🇬🇭'},
    {name:'Greece',flag:'🇬🇷'},{name:'Guatemala',flag:'🇬🇹'},{name:'Honduras',flag:'🇭🇳'},
    {name:'Hungary',flag:'🇭🇺'},{name:'India',flag:'🇮🇳'},{name:'Indonesia',flag:'🇮🇩'},
    {name:'Iran',flag:'🇮🇷'},{name:'Iraq',flag:'🇮🇶'},{name:'Ireland',flag:'🇮🇪'},
    {name:'Israel',flag:'🇮🇱'},{name:'Italy',flag:'🇮🇹'},{name:'Jamaica',flag:'🇯🇲'},
    {name:'Japan',flag:'🇯🇵'},{name:'Jordan',flag:'🇯🇴'},{name:'Kenya',flag:'🇰🇪'},
    {name:'South Korea',flag:'🇰🇷'},{name:'Lebanon',flag:'🇱🇧'},{name:'Malaysia',flag:'🇲🇾'},
    {name:'Mexico',flag:'🇲🇽'},{name:'Morocco',flag:'🇲🇦'},{name:'Netherlands',flag:'🇳🇱'},
    {name:'New Zealand',flag:'🇳🇿'},{name:'Nicaragua',flag:'🇳🇮'},{name:'Nigeria',flag:'🇳🇬'},
    {name:'Norway',flag:'🇳🇴'},{name:'Pakistan',flag:'🇵🇰'},{name:'Panama',flag:'🇵🇦'},
    {name:'Paraguay',flag:'🇵🇾'},{name:'Peru',flag:'🇵🇪'},{name:'Philippines',flag:'🇵🇭'},
    {name:'Poland',flag:'🇵🇱'},{name:'Portugal',flag:'🇵🇹'},{name:'Puerto Rico',flag:'🇵🇷'},
    {name:'Romania',flag:'🇷🇴'},{name:'Russia',flag:'🇷🇺'},{name:'Saudi Arabia',flag:'🇸🇦'},
    {name:'Senegal',flag:'🇸🇳'},{name:'Serbia',flag:'🇷🇸'},{name:'South Africa',flag:'🇿🇦'},
    {name:'Spain',flag:'🇪🇸'},{name:'Sweden',flag:'🇸🇪'},{name:'Switzerland',flag:'🇨🇭'},
    {name:'Taiwan',flag:'🇹🇼'},{name:'Thailand',flag:'🇹🇭'},{name:'Turkey',flag:'🇹🇷'},
    {name:'Ukraine',flag:'🇺🇦'},{name:'United Kingdom',flag:'🇬🇧'},{name:'United States',flag:'🇺🇸'},
    {name:'Uruguay',flag:'🇺🇾'},{name:'Venezuela',flag:'🇻🇪'},{name:'Vietnam',flag:'🇻🇳'},
].sort((a,b)=>a.name.localeCompare(b.name));

const SPORTS = [
    'Soccer','Basketball','Tennis','Volleyball','Pickleball',
    'Baseball','Football','Handball','Softball','Dodgeball','Kickball',
];
const SPORT_ICONS = {
    Soccer:'football-outline',Basketball:'basketball-outline',Tennis:'tennisball-outline',
    Volleyball:'baseball-outline',Pickleball:'baseball-outline',Baseball:'baseball-outline',
    Football:'american-football-outline',Handball:'hand-left-outline',
    Softball:'baseball-outline',Dodgeball:'radio-button-on-outline',Kickball:'football-outline',
};

function CountryPicker({ value, onChange, error }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    return (
        <View>
            <TouchableOpacity style={[styles.inputWrapper, error&&styles.inputError, {flexDirection:'row',alignItems:'center'}]} onPress={()=>setOpen(!open)}>
                {value
                    ?<View style={{flexDirection:'row',alignItems:'center',flex:1,paddingHorizontal:16,paddingVertical:13}}><Text style={{fontSize:22,marginRight:10}}>{value.flag}</Text><Text style={{fontSize:15,color:'#1a1a2e',fontWeight:'600'}}>{value.name}</Text></View>
                    :<Text style={{flex:1,paddingHorizontal:16,paddingVertical:13,fontSize:15,color:'#bbb'}}>Select your country...</Text>
                }
                <Ionicons name={open?'chevron-up':'chevron-down'} size={16} color="#bbb" style={{marginRight:14}}/>
            </TouchableOpacity>
            {open&&(
                <View style={styles.dropdown}>
                    <View style={styles.dropdownSearch}>
                        <Ionicons name="search-outline" size={16} color="#bbb"/>
                        <TextInput style={styles.dropdownSearchInput} placeholder="Search country..." placeholderTextColor="#bbb" value={query} onChangeText={setQuery} autoFocus/>
                        <TouchableOpacity onPress={()=>{setOpen(false);setQuery('');}}><Ionicons name="close" size={18} color="#999"/></TouchableOpacity>
                    </View>
                    <ScrollView style={{maxHeight:200}} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {filtered.map(item=>(
                            <TouchableOpacity key={item.name} style={[styles.dropdownItem, value?.name===item.name&&styles.dropdownItemActive]}
                                onPress={()=>{onChange(item);setOpen(false);setQuery('');}}>
                                <Text style={{fontSize:20,marginRight:12}}>{item.flag}</Text>
                                <Text style={[styles.dropdownItemText, value?.name===item.name&&{color:'#16a34a',fontWeight:'700'}]}>{item.name}</Text>
                                {value?.name===item.name&&<Ionicons name="checkmark" size={16} color="#16a34a" style={{marginLeft:'auto'}}/>}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

function DOBInput({ value, onChange, error }) {
    const format = text => {
        const d = text.replace(/\D/g,'');
        if(d.length<=2) return d;
        if(d.length<=4) return `${d.slice(0,2)}-${d.slice(2)}`;
        return `${d.slice(0,2)}-${d.slice(2,4)}-${d.slice(4,8)}`;
    };
    return (
        <View style={[styles.inputWrapper, error&&styles.inputError, {flexDirection:'row',alignItems:'center'}]}>
            <Ionicons name="calendar-outline" size={17} color={error?'#e94560':'#bbb'} style={{paddingLeft:14}}/>
            <TextInput style={[styles.input,{flex:1}]} value={value} onChangeText={t=>onChange(format(t))}
                placeholder="MM-DD-YYYY" placeholderTextColor="#bbb" keyboardType="numeric" maxLength={10}/>
        </View>
    );
}

function StepName({ formData, update, errors }) {
    return (
        <View>
            <Text style={styles.stepHeadline}>What's your name?</Text>
            <Text style={styles.stepSub}>This is how other players will see you.</Text>
            <View style={{flexDirection:'row',gap:10}}>
                <View style={{flex:1}}>
                    <View style={[styles.inputWrapper,errors.firstName&&styles.inputError]}>
                        <TextInput style={styles.input} value={formData.firstName} onChangeText={v=>update({firstName:v})}
                            placeholder="First name" placeholderTextColor="#bbb" autoCapitalize="words" autoFocus />
                    </View>
                    {errors.firstName&&<Text style={styles.errText}>{errors.firstName}</Text>}
                </View>
                <View style={{flex:1}}>
                    <View style={[styles.inputWrapper,errors.lastName&&styles.inputError]}>
                        <TextInput style={styles.input} value={formData.lastName} onChangeText={v=>update({lastName:v})}
                            placeholder="Last name" placeholderTextColor="#bbb" autoCapitalize="words" />
                    </View>
                    {errors.lastName&&<Text style={styles.errText}>{errors.lastName}</Text>}
                </View>
            </View>
        </View>
    );
}

function StepAccount({ formData, update, errors }) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.stepTitle}>Create your account</Text>
            <Text style={styles.stepSub}>All fields required</Text>
            <View style={styles.nameRow}>
                <View style={{flex:1}}>
                    <Text style={styles.fieldLabel}>First Name <Text style={styles.req}>*</Text></Text>
                    <View style={[styles.inputWrapper,errors.firstName&&styles.inputError]}>
                        <TextInput style={styles.input} value={formData.firstName} onChangeText={v=>update({firstName:v})} placeholder="First" placeholderTextColor="#bbb" autoCapitalize="words"/>
                    </View>
                    {errors.firstName&&<Text style={styles.errText}>{errors.firstName}</Text>}
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.fieldLabel}>Last Name <Text style={styles.req}>*</Text></Text>
                    <View style={[styles.inputWrapper,errors.lastName&&styles.inputError]}>
                        <TextInput style={styles.input} value={formData.lastName} onChangeText={v=>update({lastName:v})} placeholder="Last" placeholderTextColor="#bbb" autoCapitalize="words"/>
                    </View>
                    {errors.lastName&&<Text style={styles.errText}>{errors.lastName}</Text>}
                </View>
            </View>
            <Text style={styles.fieldLabel}>Email <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputWrapper,errors.email&&styles.inputError]}>
                <TextInput style={styles.input} value={formData.email} onChangeText={v=>update({email:v})} placeholder="your@email.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>
            </View>
            {errors.email&&<Text style={styles.errText}>{errors.email}</Text>}
            <Text style={styles.fieldLabel}>Password <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputWrapper,errors.password&&styles.inputError,{flexDirection:'row',alignItems:'center'}]}>
                <TextInput style={[styles.input,{flex:1}]} value={formData.password} onChangeText={v=>update({password:v})} placeholder="Min 6 characters" placeholderTextColor="#bbb" secureTextEntry={!formData.showPassword} autoCapitalize="none"/>
                <TouchableOpacity onPress={()=>update({showPassword:!formData.showPassword})} style={{paddingRight:14}}>
                    <Ionicons name={formData.showPassword?'eye-outline':'eye-off-outline'} size={17} color="#bbb"/>
                </TouchableOpacity>
            </View>
            {errors.password&&<Text style={styles.errText}>{errors.password}</Text>}
            <Text style={styles.fieldLabel}>Confirm Password <Text style={styles.req}>*</Text></Text>
            <View style={[styles.inputWrapper,errors.confirmPassword&&styles.inputError]}>
                <TextInput style={styles.input} value={formData.confirmPassword} onChangeText={v=>update({confirmPassword:v})} placeholder="Repeat password" placeholderTextColor="#bbb" secureTextEntry={!formData.showPassword} autoCapitalize="none"/>
            </View>
            {errors.confirmPassword&&<Text style={styles.errText}>{errors.confirmPassword}</Text>}
        </ScrollView>
    );
}

function StepDetails({ formData, update, errors }) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.stepTitle}>Your profile</Text>
            <Text style={styles.stepSub}>DOB and country required. Sports and bio are optional.</Text>
            <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.req}>*</Text></Text>
            <DOBInput value={formData.dateOfBirth} onChange={v=>update({dateOfBirth:v})} error={errors.dob}/>
            {errors.dob&&<Text style={styles.errText}>{errors.dob}</Text>}
            <Text style={[styles.fieldLabel,{marginTop:16}]}>Country <Text style={styles.req}>*</Text></Text>
            <CountryPicker value={formData.country} onChange={v=>update({country:v})} error={errors.country}/>
            {errors.country&&<Text style={styles.errText}>{errors.country}</Text>}
            <Text style={[styles.fieldLabel,{marginTop:20}]}>Sports <Text style={styles.opt}>(optional)</Text></Text>
            <View style={styles.sportsGrid}>
                {SPORTS.map(sport=>{
                    const active=formData.sports.includes(sport);
                    return(
                        <TouchableOpacity key={sport} style={[styles.sportChip,active&&styles.sportChipActive]}
                            onPress={()=>update({sports:active?formData.sports.filter(s=>s!==sport):[...formData.sports,sport]})}>
                            <Ionicons name={SPORT_ICONS[sport]} size={14} color={active?'#fff':'#555'}/>
                            <Text style={[styles.sportChipText,active&&styles.sportChipTextActive]}>{sport}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={[styles.fieldLabel,{marginTop:20}]}>Bio <Text style={styles.opt}>(optional)</Text></Text>
            <View style={styles.bioWrapper}>
                <TextInput style={styles.bioInput} value={formData.bio} onChangeText={v=>v.length<=150&&update({bio:v})}
                    placeholder="Tell the community who you are as a player..." placeholderTextColor="#bbb"
                    multiline numberOfLines={4} textAlignVertical="top"/>
                <Text style={[styles.charCount,formData.bio.length>120&&{color:'#e94560'}]}>{formData.bio.length}/150</Text>
            </View>
        </ScrollView>
    );
}

export default function SetupScreen({ onComplete, authMethod='email', socialUser=null }) {
    const isSocial = authMethod==='google'||authMethod==='apple';
    const needsName = isSocial && (!socialUser?.first_name || socialUser.first_name.trim() === '');
    const STEPS = isSocial
        ? (needsName ? ['name','details','avatar'] : ['details','avatar'])
        : ['account','details','avatar'];
    const TITLES = isSocial
        ? (needsName
            ? ['1 of 3 — Your Name','2 of 3 — Your Profile','3 of 3 — Your Look']
            : ['1 of 2 — Your Profile','2 of 2 — Your Look'])
        : ['1 of 3 — Account','2 of 3 — Your Profile','3 of 3 — Your Look'];
    const SKIPPABLE = isSocial
        ? (needsName ? [false,false,true] : [false,true])
        : [false,false,true];

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const [formData, setFormData] = useState({
        firstName: socialUser?.first_name||'',
        lastName: socialUser?.last_name||'',
        email: socialUser?.email||'',
        password:'', confirmPassword:'', showPassword:false,
        dateOfBirth:'', country:null, sports:[], bio:'',
        photo:null,
        avatar:{skinTone:'#F5C89A',hairStyle:'short',hairColor:'#1a1a1a',facialHair:'none',accessory:'none',eyeColor:'dark',expression:'neutral',jerseyNumber:''},
    });

    const update = changes => setFormData(prev=>({...prev,...changes}));

    const animateStep = dir => {
        Animated.sequence([
            Animated.timing(slideAnim,{toValue:dir*-50,duration:130,useNativeDriver:true}),
            Animated.timing(slideAnim,{toValue:dir*50,duration:0,useNativeDriver:true}),
            Animated.spring(slideAnim,{toValue:0,friction:8,tension:70,useNativeDriver:true}),
        ]).start();
    };

    const validate = () => {
        const cur = STEPS[step];
        const e = {};
        if(cur==='name'){
            if(!formData.firstName.trim()) e.firstName='Required';
            if(!formData.lastName.trim()) e.lastName='Required';
        }
        if(cur==='account'){
            if(!formData.firstName.trim()) e.firstName='Required';
            if(!formData.lastName.trim()) e.lastName='Required';
            if(!formData.email.trim()) e.email='Required';
            else if(!/\S+@\S+\.\S+/.test(formData.email)) e.email='Enter a valid email';
            if(!formData.password) e.password='Required';
            else if(formData.password.length<6) e.password='At least 6 characters';
            if(formData.password!==formData.confirmPassword) e.confirmPassword='Passwords do not match';
        }
        if(cur==='details'){
            if(!formData.dateOfBirth||formData.dateOfBirth.length<10) e.dob='Please enter your full date of birth';
            else {
                const p=formData.dateOfBirth.split('-');
                const dob=new Date(`${p[2]}-${p[0]}-${p[1]}`);
                const age=(new Date()-dob)/(1000*60*60*24*365.25);
                if(isNaN(dob.getTime())) e.dob='Invalid date';
                else if(age<13) e.dob='You must be at least 13';
                else if(age>100) e.dob='Invalid date';
            }
            if(!formData.country) e.country='Please select your country';
        }
        setErrors(e);
        return Object.keys(e).length===0;
    };

    const next = async () => {
        if(!validate()) return;
        if(STEPS[step]==='account'){
            try {
                setLoading(true);
                await signupWithEmail(formData.firstName,formData.lastName,formData.email,formData.password);
            } catch(e) { setErrors({email:e.message}); setLoading(false); return; }
            finally { setLoading(false); }
        }
        animateStep(1);
        setStep(s=>s+1);
    };

    const back = () => { animateStep(-1); setStep(s=>s-1); };

    const handleComplete = () => {
        const p = formData.dateOfBirth.split('-');
        const dob = formData.dateOfBirth.length===10 ? `${p[2]}-${p[0]}-${p[1]}` : null;
        onComplete({...formData, dateOfBirth:dob, nationality:formData.country?.name||null});
    };

    const isLast = step===STEPS.length-1;
    const cur = STEPS[step];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.progressRow}>
                    {STEPS.map((_,i)=><View key={i} style={[styles.progressBar,i<step&&styles.progressBarDone,i===step&&styles.progressBarActive]}/>)}
                </View>
                <Text style={styles.stepIndicator}>{TITLES[step]}</Text>
            </View>

            <Animated.View style={[styles.content,{transform:[{translateX:slideAnim}]}]}>
                {cur==='name'    && <StepName    formData={formData} update={update} errors={errors}/>}
                {cur==='account' && <StepAccount formData={formData} update={update} errors={errors}/>}
                {cur==='details' && <StepDetails formData={formData} update={update} errors={errors}/>}
                {cur==='avatar' && <StepAvatar formData={formData} update={update}/>}
            </Animated.View>

            <View style={styles.footer}>
                {step>0
                    ?<TouchableOpacity style={styles.backBtn} onPress={back}><Ionicons name="arrow-back" size={18} color="#555"/><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
                    :<View style={{width:80}}/>
                }
                <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
                    {SKIPPABLE[step]&&(
                        <TouchableOpacity onPress={isLast?handleComplete:()=>{animateStep(1);setStep(s=>s+1);}}>
                            <Text style={styles.skipText}>{isLast?'Skip & Finish':'Skip'}</Text>
                        </TouchableOpacity>
                    )}
                    {isLast?(
                        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
                            <LinearGradient colors={['#16a34a','#15803d']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.completeBtnInner}>
                                <Text style={styles.completeBtnText}>Let's Play!</Text>
                                <Ionicons name="football-outline" size={18} color="#fff"/>
                            </LinearGradient>
                        </TouchableOpacity>
                    ):(
                        <TouchableOpacity style={styles.nextBtn} onPress={next} disabled={loading}>
                            <Text style={styles.nextBtnText}>{loading?'Creating...':'Next'}</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff"/>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{flex:1,backgroundColor:'#fff'},
    header:{paddingTop:60,paddingBottom:16,paddingHorizontal:24,borderBottomWidth:1,borderBottomColor:'#f5f5f5'},
    progressRow:{flexDirection:'row',gap:6,marginBottom:10},
    progressBar:{flex:1,height:4,borderRadius:2,backgroundColor:'#f0f0f0'},
    progressBarDone:{backgroundColor:'#86efac'},
    progressBarActive:{backgroundColor:'#16a34a'},
    stepIndicator:{fontSize:11,fontWeight:'700',color:'#999',letterSpacing:1.5,textTransform:'uppercase'},
    content:{flex:1,paddingHorizontal:24,paddingTop:12},
    footer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:24,paddingTop:12,paddingBottom:40,borderTopWidth:1,borderTopColor:'#f5f5f5'},
    stepTitle:{fontSize:26,fontWeight:'900',color:'#1a1a2e',marginBottom:6,marginTop:8},
    stepSub:{fontSize:13,color:'#aaa',marginBottom:20,lineHeight:19},
    req:{color:'#e94560'},
    opt:{color:'#bbb',fontSize:12},
    fieldLabel:{fontSize:13,fontWeight:'700',color:'#555',marginBottom:6},
    nameRow:{flexDirection:'row',gap:10,marginBottom:4},
    inputWrapper:{backgroundColor:'#f8f9fb',borderRadius:12,borderWidth:1.5,borderColor:'#f0f0f0',marginBottom:4},
    inputError:{borderColor:'#e94560'},
    input:{paddingVertical:13,paddingHorizontal:16,fontSize:15,color:'#1a1a2e'},
    errText:{color:'#e94560',fontSize:12,marginBottom:8,marginLeft:2},
    dropdown:{backgroundColor:'#fff',borderRadius:12,borderWidth:1.5,borderColor:'#f0f0f0',marginTop:4,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:12,elevation:8},
    dropdownSearch:{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderBottomWidth:1,borderBottomColor:'#f5f5f5'},
    dropdownSearchInput:{flex:1,fontSize:15,color:'#1a1a2e',paddingVertical:2},
    dropdownItem:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12},
    dropdownItemActive:{backgroundColor:'#f0fdf4'},
    dropdownItemText:{fontSize:15,color:'#1a1a2e'},
    sportsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:4},
    sportChip:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:12,paddingVertical:8,backgroundColor:'#f8f9fb',borderRadius:20,borderWidth:1.5,borderColor:'#f0f0f0'},
    sportChipActive:{backgroundColor:'#16a34a',borderColor:'#16a34a'},
    sportChipText:{fontSize:13,fontWeight:'600',color:'#555'},
    sportChipTextActive:{color:'#fff'},
    bioWrapper:{backgroundColor:'#f8f9fb',borderRadius:16,borderWidth:1.5,borderColor:'#f0f0f0',padding:16},
    bioInput:{fontSize:15,color:'#1a1a2e',minHeight:100,lineHeight:22},
    charCount:{textAlign:'right',color:'#bbb',fontSize:12,marginTop:6,fontWeight:'600'},
    backBtn:{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:12,paddingHorizontal:16,borderRadius:12,backgroundColor:'#f8f9fb'},
    backBtnText:{fontSize:15,fontWeight:'600',color:'#555'},
    skipText:{fontSize:14,fontWeight:'600',color:'#bbb',paddingHorizontal:8},
    nextBtn:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:12,paddingHorizontal:20,borderRadius:12,backgroundColor:'#1a1a2e'},
    nextBtnText:{fontSize:15,fontWeight:'700',color:'#fff'},
    completeBtn:{borderRadius:12,overflow:'hidden'},
    completeBtnInner:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:12,paddingHorizontal:20},
    completeBtnText:{fontSize:15,fontWeight:'800',color:'#fff',letterSpacing:1},
});