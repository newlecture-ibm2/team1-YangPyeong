import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class CleanDB {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:postgresql://127.0.0.1:5151/farm_db", "farm", "farmbalance1234!");
        Statement stmt = conn.createStatement();
        stmt.execute("ALTER TABLE download_history ALTER COLUMN user_id SET NOT NULL;");
        stmt.execute("ALTER TABLE download_history ADD CONSTRAINT fk_download_history_user FOREIGN KEY (user_id) REFERENCES users(id);");
        System.out.println("FK added!");
    }
}
