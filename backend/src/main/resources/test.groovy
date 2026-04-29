import java.sql.DriverManager

def url = System.getenv("DB_URL") ?: "jdbc:postgresql://localhost:5432/farmbalance"
// Let's try localhost 5151 maybe?
println "Trying localhost:5151"
try {
    def con = DriverManager.getConnection("jdbc:postgresql://localhost:5151/farmbalance?user=postgres&password=password")
    def stmt = con.createStatement()
    def rs = stmt.executeQuery("SELECT count(*) FROM users")
    rs.next()
    println "users on 5151 farmbalance: " + rs.getInt(1)
} catch(Exception e) { println e.message }

