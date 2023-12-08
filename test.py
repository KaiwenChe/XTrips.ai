from hashlib import sha256

i = "osijdfoi"
i = i.encode('utf-8')
print(sha256(i))
print(sha256(i).hexdigest())