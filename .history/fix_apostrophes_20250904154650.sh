#!/bin/bash
# Fix apostrophes in Tasks.js
sed -i "s/O'chirish/O\\'chirish/g" "/home/abdunodir/Patent syat/client/src/pages/components/Tasks.js"
sed -i "s/ko'rish/ko\\'rish/g" "/home/abdunodir/Patent syat/client/src/pages/components/Tasks.js"
