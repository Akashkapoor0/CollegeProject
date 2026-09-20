# File Integrity Checker (Java Swing)

A lightweight Java Swing application for verifying file and folder integrity using **SHA-256 hashing**.  
The tool compares files/directories, detects differences, stores history, and exports results to CSV.

---

## ⭐ Features
- SHA-256 hash generation  
- File-to-file and folder-to-folder comparison  
- Detects Same / Modified / Missing / Extra files  
- History saving and viewing  
- CSV export functionality  
- Clean and simple GUI built with Swing  

---

## 🔧 Technologies Used
- Java (JDK 8+)  
- Swing / AWT  
- MessageDigest (SHA-256)  
- File I/O  
- Java Collections Framework  

---

## 🚀 How to Run
1. Install **JDK 8 or later**
2. Compile the project:
   ```bash
   javac FileIntegritySystem.java
3.Run the application:
  java FileIntegritySystem
## 📁 Project Structure
  FileIntegritySystem.java
  history.txt      (auto-created)
  CSV files        (exported on demand)
  README.md

## 🔍 How It Works
1. Select File or Folder mode
2. Browse and choose two path
3. Generate SHA-256 hashes
4. Compare integrity
5. View table results
6. Save history or export CSV

## 📌 Future Improvements
1. Support for MD5 / SHA-1 / SHA-512
2. Real-time file monitoring
3. Improved UI themes
4. Advanced reporting formats (PDF/HTML)

## 📄 License
1. MIT License © 202
