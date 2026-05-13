import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class test_db {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/farmbalance", "farm_user", "farm_pass");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT id, is_read, title FROM notifications ORDER BY created_at DESC LIMIT 5");
        while(rs.next()) {
            System.out.println("ID: " + rs.getLong("id") + ", isRead: " + rs.getBoolean("is_read") + ", Title: " + rs.getString("title"));
        }
        conn.close();
    }
}
