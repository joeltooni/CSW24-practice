const fs = require('fs');

const rawHooks = `
bcfm AA hls
cdfgjklnstw AB abosy
bcdfghlmprstwy AD dosz
bdfghkmnstvwy AE 
bcdfghjlmnrstvwyz AG aeos
abdfhlnpry AH ais
jkrstw AI adlmnrst
abcdgmps AL abeflpstu
bcdghjklmnprsty AM aeipu
bcdefghmnprstvw AN adeinsty
bcefgjlmopstwy AR bcdefkmsty
abdefghklmnprtvwyz AS hkps
bcefghklmnopqrstrvw AT est
cdfghjklmnprstvwy AW aekln
flmprstvwz AX e
bcdfghjklmnprstwy AY esu
ao BA acdeghlmnoprsty
o BE deglnstyz
o BI bdgnostz
ao BO abdghiknoprstwxy
a BY es
aeio CH aei
o DA bdeghklmnpswy
io DE befgilnpvwxy
 DI bdefgmnpstv
au DO bcdefghlmnoprstwxy
klpstyz EA nrstu
bfgklmnprstwxz ED hs
bcdfjlmnprstvwz EE klnw
dknrt EF fst
fhmpxy EH s
bcdegmpstz EL dfklmst
fghmrw EM eosu
bdefghkmprstwyz EN degs
fghpsy ER aefgkmnrs
bfhlmoprty ES st
bfghjklmnprstvwy ET ah
defhjlmnprsty EW ekt
dhklrstvwyz EX o
 FA abdeghnprstwxy
 FE deghmnrstuvwyz
 FY 
 GI bdefgnopst
aey GO abdenorstvxy
 GU belmnprstvy
acsw HA deghjmnopstwy
cst HE hmnprstwxy
acgkp HI cdemnpst
o HM m
moprstwz HO abcdeghimnopstwxy
abcdfghklmnrtvy ID es
dgkrs IF fs
abdfghjklpqrstvwyz IN gkns
bg IO ns
abcdghklmnopqstvwx IS hmo
abcdfghklnprstwz IT as
 JA bgikmprwy
 JO beglrtwy
aos KA befikmstwy
s KI dfnprst
 KO abinprsw
s KY eu
a LA bcdghmprstvwxy
 LI bdegnpst
 LO bdgoprstuwy
aos MA acdegklmnprstwxy
aeu ME deghlmnstuw
a MI bcdglmrsxz
hmu MM m
e MO abcdegilmnoprstuwyz
aeu MU dgmnstx
 MY c
am NA beghmnpstvwy
aeo NE bdefgkptw
o NO bdghmnorstwxy
g NU bgnrst
aos NY ems
bcdfghjklmnrsy OB aeios
bcdghlmnprsty OD ades
dfghjmrtvw OE s
dow OF ft
bdfhnops OH mos
bhkmp OI kls
brwy OK ae
dhmnoprstvy OM as
bcdefghikmnostwy ON eosy
bcdfghlmnprtwz OO fhmnprst
bcdfhklmopstw OP aest
bcdfgjklmnotv OR abcdefgst
bcdghiklmnopswz OS e
flmsy OU dkprst
bcdhjklmnprstvwy OW elnt
bcdfghlnpsvw OX oy
bcdfghjlmnst OY es
os PA cdhklmnprstvwxy
ao PE acdeghlnprstw
 PI acegnprstux
au PO adhilmopstwxz
 QI ns
aeiopu RE bcdefghimnopstvwxz
ai SH aehoy
p SI bcfgkmnprstx
di SO bcdghlmnpstuvwxyz
ep ST y
eiu TA bdegijkmnoprstuvwxy
au TE acdefglnstwx
 TI cdegklnpstxz
 TO cdegmnoprtwy
bdfhjlmnprstvy UG hs
dhp UH 
bcdfghlmrstvy UM empsu
bdfghjlmnprst UN is
cdghopsty UP os
bcfglonps UR bdenp
bgjmnopswy US e
bcghjmnoprt UT aesu
aeo WE bdemntxy
t WO efgknopstwx
 XI s
 XU 
pr YA deghkmprswy
abdehklnoprstw YE ahnprstwxz
 YO bdkmnuw
akr YU gkmps
 ZA gpsx
 ZE adeklnpx
ad ZO alos
`;

const hookMap = {};
rawHooks.split('\n').forEach(line => {
  if (!line.trim()) return;
  const match = line.match(/([a-z]*)\s*([A-Z]{2})\s*([a-z]*)/);
  if (match) {
    hookMap[match[2]] = {
      front: match[1] || '',
      back: match[3] || ''
    };
  }
});

const data = JSON.parse(fs.readFileSync('public/2-letters.json', 'utf8'));

// Handle both array and object structures just in case
let arr = Array.isArray(data) ? data : data.words;

arr.forEach(w => {
  const hooks = hookMap[w.word];
  if (hooks) {
    w.frontHooks = hooks.front;
    w.backHooks = hooks.back;
  }
});

fs.writeFileSync('public/2-letters.json', JSON.stringify(data, null, 2));
console.log('Hooks injected!');
