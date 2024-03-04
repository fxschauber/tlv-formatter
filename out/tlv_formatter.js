"use strict";
// const message = '6f81868407a0000000041010a53850105649534120434f4e544143544c4553539f38189f66049f02069f03069f1a0295055f2a029a039c019f3704bf0c089f5a0510084008408407a0000000031010a53850105649534120434f4e544143544c4553539f38189f66049f02069f03069f1a0295055f2a029a039c019f3704bf0c089f5a0510084008409000'
// const buffer = Buffer.from(message);
// let array = message.match(/..?/g)
// let array2 = Array
// for (let i = 0; i < array.length; i++) {
//   array[i] = parseInt('0x' + array[i], 16)
// }
function bertlv_tag_calc_decode_size(data) {
    let i = 0;
    if (!data[0])
        return 0;
    if ((data[i++] & 0x1f) != 0x1f)
        return 1;
    for (; data[i] & 0x80; i++)
        ;
    return i + 1;
}
function bertlv_tag_decode(data) {
    let size = bertlv_tag_calc_decode_size(data);
    if (!size)
        return 0;
    let tag = 0;
    for (let i = 0; i < size; i++) {
        tag <<= 8;
        tag |= data[i];
    }
    return tag;
}
function bertlv_get_tag(tlv) {
    return bertlv_tag_decode(tlv) >>> 0;
}
function bertlv_len_calc_decode_size(data) {
    if (!(data[0] & 0x80))
        return 1;
    let subsequence_count = data[0] & ~0x80;
    if (subsequence_count == 0 || subsequence_count == 0x7F)
        return 0;
    return 1 + subsequence_count;
}
function bertlv_len_decode(data) {
    let size = bertlv_len_calc_decode_size(data);
    if (!size)
        return 0;
    if (size == 1)
        return data[0];
    let length = 0;
    for (let i = 1; i < size; ++i) {
        length <<= 8;
        length |= data[i];
    }
    return length;
}
function bertlv_get_length(tlv) {
    let i = 0;
    if (!tlv)
        return 0;
    let tag_size = bertlv_tag_calc_decode_size(tlv);
    if (!tag_size)
        return 0;
    i += tag_size;
    return bertlv_len_decode(tlv.slice(i));
}
function bertlv_get_value(tlv) {
    let i = 0;
    let tag_size = bertlv_tag_calc_decode_size(tlv);
    if (!tag_size)
        return null;
    i += tag_size;
    let len_size = bertlv_len_calc_decode_size(tlv.slice(i));
    if (!len_size)
        return null;
    let len = bertlv_len_decode(tlv.slice(i));
    i += len_size;
    return tlv.slice(i, i + len);
}
function bertlv_is_contstructed_tag(tag) {
    if (tag & 0xff000000)
        return tag & 0x20000000;
    else if (tag & 0xff0000)
        return tag & 0x200000;
    else if (tag & 0xff00)
        return tag & 0x2000;
    else
        return tag & 0x20;
}
function bertlv_get_total_size(tlv) {
    let tag_size = bertlv_tag_calc_decode_size(tlv);
    if (!tag_size)
        return 0;
    tlv = tlv.slice(tag_size);
    let len_size = bertlv_len_calc_decode_size(tlv);
    if (!len_size)
        return 0;
    let len_value = bertlv_len_decode(tlv);
    return tag_size + len_size + len_value;
}
function getString(buf) {
    var s = "";
    for (let i = 0; i < buf.length; i++)
        s += buf[i].toString(16).padStart(2, '0');
    return s;
}
function get_pretty_tlv(tlv, indent) {
    var s = "";
    while (tlv.length > 0) {
        let tag = bertlv_get_tag(tlv);
        let len = bertlv_get_length(tlv);
        if (bertlv_is_contstructed_tag(tag)) {
            s += '  '.repeat(indent) + `${tag.toString(16)} ${len.toString(16).padStart(2, '0')}` + '\n';
            let val = bertlv_get_value(tlv);
            s += get_pretty_tlv(val, indent + 1);
            let size = bertlv_get_total_size(tlv);
            tlv = tlv.slice(size);
        }
        else {
            var s_tag = `${tag.toString(16)} ${len.toString(16).padStart(2, '0')} `;
            s_tag += getString(bertlv_get_value(tlv));
            s += '  '.repeat(indent) + s_tag + '\n';
            let size = bertlv_get_total_size(tlv);
            tlv = tlv.slice(size);
        }
    }
    return s;
}
//# sourceMappingURL=tlv_formatter.js.map