
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class FileIntegritySystem extends JFrame {

    private static final String HISTORY_FILE = "history.txt";

    private JTextField path1Field, path2Field;
    private JTextArea hash1Area, hash2Area;
    private JLabel modeLabel;
    private boolean isFolderMode = false; // false = File mode, true = Folder mode

    public FileIntegritySystem() {
        setTitle("File Integrity System");
        setSize(980, 720);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        // Top gradient header
        add(createHeaderPanel(), BorderLayout.NORTH);

        // Center content
        add(createCenterPanel(), BorderLayout.CENTER);

        // Bottom controls
        add(createBottomPanel(), BorderLayout.SOUTH);
    }

    private JPanel createHeaderPanel() {
        JPanel header = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2d = (Graphics2D) g.create();
                int w = getWidth(), h = getHeight();
                GradientPaint gp = new GradientPaint(0, 0, new Color(10, 115, 230),
                        0, h, new Color(135, 206, 250));
                g2d.setPaint(gp);
                g2d.fillRoundRect(0, 0, w, h + 20, 30, 30);
                g2d.dispose();
            }
        };
        header.setPreferredSize(new Dimension(0, 80));
        header.setLayout(new BorderLayout());
        header.setBorder(new EmptyBorder(10, 20, 10, 20));

        JLabel title = new JLabel("File Integrity System", SwingConstants.CENTER);
        title.setFont(new Font("Segoe UI Semibold", Font.BOLD, 30));
        title.setForeground(Color.white);
        header.add(title, BorderLayout.CENTER);

        modeLabel = new JLabel("Mode: File Comparison");
        modeLabel.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        modeLabel.setForeground(Color.white);
        header.add(modeLabel, BorderLayout.EAST);

        return header;
    }

    private JPanel createCenterPanel() {
        JPanel center = new JPanel();
        center.setLayout(new BoxLayout(center, BoxLayout.Y_AXIS));
        center.setBorder(new EmptyBorder(18, 18, 18, 18));
        center.setBackground(new Color(245, 248, 255));

        // Input panels
        JPanel inputs = new JPanel(new GridLayout(2, 1, 10, 10));
        inputs.setOpaque(false);

        JPanel p1 = createPathPanel("Path 1 (File or Folder)", true);
        JPanel p2 = createPathPanel("Path 2 (File or Folder)", false);

        inputs.add(p1);
        inputs.add(p2);

        center.add(inputs);
        center.add(Box.createVerticalStrut(12));

        // Hash summary areas
        JPanel summaryPanel = new JPanel(new GridLayout(1, 2, 12, 12));
        summaryPanel.setOpaque(false);

        hash1Area = createSummaryArea("Path 1 Hash Summary");
        hash2Area = createSummaryArea("Path 2 Hash Summary");

        summaryPanel.add(new JScrollPane(hash1Area));
        summaryPanel.add(new JScrollPane(hash2Area));

        center.add(summaryPanel);
        return center;
    }

    private JPanel createPathPanel(String label, boolean first) {
        JPanel panel = new JPanel(new BorderLayout(8, 8));
        panel.setOpaque(false);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(220, 230, 250), 1),
                BorderFactory.createEmptyBorder(10, 10, 10, 10)
        ));
        JLabel lbl = new JLabel(label);
        lbl.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        panel.add(lbl, BorderLayout.NORTH);

        JTextField field = new JTextField();
        field.setFont(new Font("Consolas", Font.PLAIN, 14));
        JButton browse = createColorButton("Browse", new Color(10, 115, 230));

        if (first) path1Field = field;
        else path2Field = field;

        JPanel middle = new JPanel(new BorderLayout(8, 8));
        middle.setOpaque(false);
        middle.add(field, BorderLayout.CENTER);
        middle.add(browse, BorderLayout.EAST);

        panel.add(middle, BorderLayout.CENTER);

        browse.addActionListener(e -> {
            JFileChooser chooser = new JFileChooser();
            chooser.setFileSelectionMode(isFolderMode ? JFileChooser.DIRECTORIES_ONLY : JFileChooser.FILES_ONLY);
            int opt = chooser.showOpenDialog(this);
            if (opt == JFileChooser.APPROVE_OPTION) {
                File sel = chooser.getSelectedFile();
                field.setText(sel.getAbsolutePath());
            }
        });

        return panel;
    }

    private JTextArea createSummaryArea(String title) {
        JTextArea area = new JTextArea();
        area.setEditable(false);
        area.setFont(new Font("Consolas", Font.PLAIN, 13));
        area.setBorder(BorderFactory.createTitledBorder(title));
        area.setBackground(new Color(250, 252, 255));
        return area;
    }

    private JPanel createBottomPanel() {
        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setBorder(new EmptyBorder(12, 18, 18, 18));
        bottom.setOpaque(false);

        JPanel leftButtons = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 8));
        leftButtons.setOpaque(false);

        JButton toggleBtn = createColorButton("Toggle File/Folder Mode", new Color(0, 153, 102));
        JButton generateBtn = createColorButton("Generate Hashes", new Color(10, 115, 230));
        JButton checkBtn = createColorButton("Check Integrity", new Color(255, 140, 0));
        JButton clearBtn = createColorButton("Clear", new Color(120, 120, 120));
        JButton viewHistoryBtn = createColorButton("View History", new Color(100, 149, 237));

        leftButtons.add(toggleBtn);
        leftButtons.add(generateBtn);
        leftButtons.add(checkBtn);
        leftButtons.add(clearBtn);
        leftButtons.add(viewHistoryBtn);

        bottom.add(leftButtons, BorderLayout.WEST);

        // Result status label on right
        JLabel info = new JLabel("Ready");
        info.setFont(new Font("Segoe UI", Font.BOLD, 14));
        info.setForeground(new Color(20, 20, 80));
        bottom.add(info, BorderLayout.EAST);

        // Actions
        toggleBtn.addActionListener(e -> {
            isFolderMode = !isFolderMode;
            modeLabel.setText("Mode: " + (isFolderMode ? "Folder Comparison" : "File Comparison"));
            JOptionPane.showMessageDialog(this, "Mode switched to: " + (isFolderMode ? "Folder Comparison" : "File Comparison"));
        });

        generateBtn.addActionListener(e -> {
            try {
                if (isFolderMode) {
                    if (!validatePaths(true)) return;
                    hash1Area.setText(generateFolderSummary(new File(path1Field.getText())));
                    hash2Area.setText(generateFolderSummary(new File(path2Field.getText())));
                    info.setText("Hashes generated for folders");
                } else {
                    if (!validatePaths(false)) return;
                    if (!path1Field.getText().isEmpty()) hash1Area.setText(getFileHash(path1Field.getText(), "SHA-256"));
                    if (!path2Field.getText().isEmpty()) hash2Area.setText(getFileHash(path2Field.getText(), "SHA-256"));
                    info.setText("Hashes generated for files");
                }
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error generating hashes: " + ex.getMessage());
            }
        });

        checkBtn.addActionListener(e -> {
            try {
                if (isFolderMode) {
                    if (!validatePaths(true)) return;
                    showFolderComparison();
                } else {
                    if (!validatePaths(false)) return;
                    showFileComparison();
                }
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error checking integrity: " + ex.getMessage());
            }
        });

        clearBtn.addActionListener(e -> {
            path1Field.setText("");
            path2Field.setText("");
            hash1Area.setText("");
            hash2Area.setText("");
            info.setText("Ready");
        });

        viewHistoryBtn.addActionListener(e -> showHistoryDialog());

        return bottom;
    }

    private JButton createColorButton(String text, Color color) {
        JButton btn = new JButton(text);
        btn.setBackground(color);
        btn.setForeground(Color.white);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(color.darker(), 2),
                BorderFactory.createEmptyBorder(8, 12, 8, 12)
        ));
        return btn;
    }

    private boolean validatePaths(boolean folderMode) {
        String p1 = path1Field.getText().trim();
        String p2 = path2Field.getText().trim();
        if (p1.isEmpty() || p2.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please select both paths first.");
            return false;
        }
        File f1 = new File(p1);
        File f2 = new File(p2);
        if (folderMode) {
            if (!f1.exists() || !f1.isDirectory() || !f2.exists() || !f2.isDirectory()) {
                JOptionPane.showMessageDialog(this, "Please select valid folders.");
                return false;
            }
        } else {
            if (!f1.exists() || !f1.isFile() || !f2.exists() || !f2.isFile()) {
                JOptionPane.showMessageDialog(this, "Please select valid files.");
                return false;
            }
        }
        return true;
    }

    private String getFileHash(String filePath, String algorithm) throws Exception {
        MessageDigest digest = MessageDigest.getInstance(algorithm);
        try (FileInputStream fis = new FileInputStream(filePath)) {
            byte[] byteArray = new byte[4 * 1024];
            int bytesCount;
            while ((bytesCount = fis.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
        }
        byte[] bytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private String generateFolderSummary(File folder) throws Exception {
        StringBuilder sb = new StringBuilder();
        Map<String, String> map = new HashMap<>();
        collectHashes(folder, map, folder.getAbsolutePath().length(), sb);
        return sb.toString();
    }

    private void collectHashes(File folder, Map<String, String> map, int baseLen, StringBuilder sb) throws Exception {
        File[] files = folder.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isFile()) {
                String relative = f.getAbsolutePath().substring(baseLen);
                if (relative.startsWith(File.separator)) relative = relative.substring(1);
                String hash = getFileHash(f.getAbsolutePath(), "SHA-256");
                map.put(relative, hash);
                sb.append(relative).append(" : ").append(hash).append("\n");
            } else if (f.isDirectory()) {
                collectHashes(f, map, baseLen, sb);
            }
        }
    }

    private void collectHashes(File folder, Map<String, String> map, int baseLen) throws Exception {
        collectHashes(folder, map, baseLen, new StringBuilder());
    }

    private void showFileComparison() {
        try {
            String h1 = hash1Area.getText().trim();
            String h2 = hash2Area.getText().trim();
            if (h1.isEmpty() || h2.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Please generate hashes first for both files.");
                return;
            }
            String status = h1.equals(h2) ? "Same" : "Modified";
            Object[] row = { new File(path1Field.getText()).getName(), status };
            showResultTable(new String[][]{ { (String)row[0], (String)row[1] } }, new String[] { "File", "Status" } );
            saveHistoryRecord("File", path1Field.getText(), path2Field.getText(), status);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error comparing files: " + ex.getMessage());
        }
    }

    private void showFolderComparison() {
        try {
            File folder1 = new File(path1Field.getText());
            File folder2 = new File(path2Field.getText());

            Map<String, String> map1 = new HashMap<>();
            Map<String, String> map2 = new HashMap<>();
            collectHashes(folder1, map1, folder1.getAbsolutePath().length());
            collectHashes(folder2, map2, folder2.getAbsolutePath().length());

            List<String[]> rows = new ArrayList<>();
            int same = 0, modified = 0, missing = 0, extra = 0;

            for (String rel : map1.keySet()) {
                if (!map2.containsKey(rel)) {
                    rows.add(new String[]{rel, "Missing"});
                    missing++;
                } else if (map1.get(rel).equals(map2.get(rel))) {
                    rows.add(new String[]{rel, "Same"});
                    same++;
                } else {
                    rows.add(new String[]{rel, "Modified"});
                    modified++;
                }
            }
            for (String rel : map2.keySet()) {
                if (!map1.containsKey(rel)) {
                    rows.add(new String[]{rel, "Extra"});
                    extra++;
                }
            }

            // Convert rows to 2D array for table
            String[][] tableData = new String[rows.size()][2];
            for (int i = 0; i < rows.size(); i++) {
                tableData[i] = rows.get(i);
            }

            String[] cols = { "File Path", "Status" };
            showResultTable(tableData, cols);

            String summary = String.format("Same:%d Modified:%d Missing:%d Extra:%d", same, modified, missing, extra);
            saveHistoryRecord("Folder", path1Field.getText(), path2Field.getText(), summary);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error comparing folders: " + ex.getMessage());
        }
    }

    private void showResultTable(String[][] data, String[] cols) {
        DefaultTableModel model = new DefaultTableModel(data, cols) {
            @Override public boolean isCellEditable(int row, int column) { return false; }
        };
        JTable table = new JTable(model);
        table.setFont(new Font("Consolas", Font.PLAIN, 13));
        table.setRowHeight(26);
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 14));
        table.setAutoCreateRowSorter(true);

        // Color renderer for status column
        table.getColumnModel().getColumn(1).setCellRenderer((table1, value, isSelected, hasFocus, row, column) -> {
            JLabel lbl = new JLabel(value.toString());
            lbl.setOpaque(true);
            String v = value.toString();
            if ("Same".equals(v)) lbl.setBackground(new Color(198, 239, 206));
            else if ("Modified".equals(v)) lbl.setBackground(new Color(255, 224, 178));
            else if ("Missing".equals(v)) lbl.setBackground(new Color(255, 204, 203));
            else if ("Extra".equals(v)) lbl.setBackground(new Color(217, 234, 246));
            else lbl.setBackground(Color.white);
            lbl.setBorder(new EmptyBorder(4,6,4,6));
            return lbl;
        });

        JScrollPane scroll = new JScrollPane(table);
        scroll.setPreferredSize(new Dimension(860, 420));

        JDialog dialog = new JDialog(this, "Comparison Result", true);
        dialog.setLayout(new BorderLayout(8,8));
        dialog.add(scroll, BorderLayout.CENTER);

        JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton exportBtn = createColorButton("Export CSV", new Color(34, 139, 34));
        JButton closeBtn = createColorButton("Close", new Color(128, 128, 128));
        bottom.add(exportBtn);
        bottom.add(closeBtn);
        dialog.add(bottom, BorderLayout.SOUTH);

        exportBtn.addActionListener(e -> exportTableToCSV(table));
        closeBtn.addActionListener(e -> dialog.dispose());

        dialog.pack();
        dialog.setLocationRelativeTo(this);
        dialog.setVisible(true);
    }

    private void exportTableToCSV(JTable table) {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Save CSV Report");
        int opt = chooser.showSaveDialog(this);
        if (opt != JFileChooser.APPROVE_OPTION) return;
        File file = chooser.getSelectedFile();
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(file))) {
            DefaultTableModel model = (DefaultTableModel) table.getModel();
            // header
            for (int c = 0; c < model.getColumnCount(); c++) {
                if (c > 0) bw.write(",");
                bw.write(model.getColumnName(c));
            }
            bw.newLine();
            // rows
            for (int r = 0; r < model.getRowCount(); r++) {
                for (int c = 0; c < model.getColumnCount(); c++) {
                    if (c > 0) bw.write(",");
                    bw.write(model.getValueAt(r, c).toString());
                }
                bw.newLine();
            }
            JOptionPane.showMessageDialog(this, "CSV exported successfully.");
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error exporting CSV: " + ex.getMessage());
        }
    }

    private void saveHistoryRecord(String mode, String p1, String p2, String result) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(HISTORY_FILE, true))) {
            bw.write(timestamp + "|" + mode + "|" + p1 + "|" + p2 + "|" + result);
            bw.newLine();
        } catch (IOException e) {
            // ignore silently
        }
    }

    private void showHistoryDialog() {
        List<String[]> records = new ArrayList<>();
        File hf = new File(HISTORY_FILE);
        if (!hf.exists()) {
            JOptionPane.showMessageDialog(this, "No history found.");
            return;
        }
        try (BufferedReader br = new BufferedReader(new FileReader(hf))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|", 5);
                if (parts.length == 5) records.add(parts);
            }
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this, "Error reading history.");
            return;
        }

        String[] cols = { "Date & Time", "Mode", "Path 1", "Path 2", "Result" };
        String[][] data = new String[records.size()][5];
        for (int i = 0; i < records.size(); i++) data[i] = records.get(i);

        DefaultTableModel model = new DefaultTableModel(data, cols) {
            @Override public boolean isCellEditable(int row, int column) { return false; }
        };
        JTable table = new JTable(model);
        table.setFont(new Font("Consolas", Font.PLAIN, 12));
        table.setRowHeight(26);
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 13));
        JScrollPane scroll = new JScrollPane(table);
        scroll.setPreferredSize(new Dimension(900, 420));

        JDialog dialog = new JDialog(this, "History", true);
        dialog.setLayout(new BorderLayout(8,8));
        dialog.add(scroll, BorderLayout.CENTER);

        JPanel controls = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton deleteSelected = createColorButton("Delete Selected", new Color(220, 20, 60));
        JButton deleteAll = createColorButton("Delete All", new Color(220, 20, 60));
        JButton closeBtn = createColorButton("Close", new Color(120, 120, 120));
        controls.add(deleteSelected);
        controls.add(deleteAll);
        controls.add(closeBtn);
        dialog.add(controls, BorderLayout.SOUTH);

        deleteSelected.addActionListener(e -> {
            int sel = table.getSelectedRow();
            if (sel == -1) {
                JOptionPane.showMessageDialog(dialog, "Select a record to delete.");
                return;
            }
            records.remove(sel);
            writeHistory(records);
            dialog.dispose();
            JOptionPane.showMessageDialog(this, "Selected record deleted.");
        });

        deleteAll.addActionListener(e -> {
            int ans = JOptionPane.showConfirmDialog(dialog, "Delete all history?", "Confirm", JOptionPane.YES_NO_OPTION);
            if (ans == JOptionPane.YES_OPTION) {
                new File(HISTORY_FILE).delete();
                dialog.dispose();
                JOptionPane.showMessageDialog(this, "All history deleted.");
            }
        });

        closeBtn.addActionListener(e -> dialog.dispose());

        dialog.pack();
        dialog.setLocationRelativeTo(this);
        dialog.setVisible(true);
    }

    private void writeHistory(List<String[]> records) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(HISTORY_FILE, false))) {
            for (String[] r : records) {
                bw.write(String.join("|", r));
                bw.newLine();
            }
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this, "Error updating history file.");
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            FileIntegritySystem app = new FileIntegritySystem();
            app.setVisible(true);
        });
    }
}
