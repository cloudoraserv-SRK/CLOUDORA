import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default function checkRole(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      const employeeId = req.headers["x-employee-id"];
      if (!employeeId) {
        return res.status(401).json({ error: "Missing employee ID" });
      }

      const { data: emp } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .maybeSingle();

      if (!emp) return res.status(404).json({ error: "Employee not found" });

      const { data: perms } = await supabase
        .from("employee_permissions")
        .select("*")
        .eq("role", emp.role);

      const employeePerms = perms?.map(p => p.permission) || [];

      const allowed = requiredPermissions.every(p => employeePerms.includes(p));
      if (!allowed) {
        return res.status(403).json({ error: "Permission denied" });
      }

      req.employee = emp;  
      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
}
