text = 'ORD-URC:UA2263~18:CA982~18:CA1251~20:0'

start = ':'
end = '~'
start_idx = text.find(start) + len(start)
end_idx = text.find(end, start_idx)
FN = ''
FN += text[start_idx: end_idx]
text.replace(text[start_idx: end_idx], "")
print(FN)