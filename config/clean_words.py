#read file words.txt
f = open("words.txt", "r")
f.readline()
newfile = open("words_clean.txt", "w")

# delete first line of f
for line in f:
    # Store last 6 characters of line in word
    word = line[-6:-1]
    #write word to newfile
    newfile.write('"'+word)
    newfile.write('", \n')