//const message = 'Hello world' // Try edit me
const message = '6f438407a0000000031010a53850105649534120434f4e544143544c4553539f38189f66049f02069f03069f1a0295055f2a029a039c019f3704bf0c089f5a0510084008409000'
const buffer = Buffer.from(message);
let array = message.match(/..?/g)

for (const b of array) {
  //console.log(b.toString(16))
  h = parseInt(b, 16);
  console.log(h.toString(16))
  if (h & 0x80)
    console.log(true)
}
