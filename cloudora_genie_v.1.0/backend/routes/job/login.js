// -------------------------------------------------------
// 5️⃣ EMPLOYEE LOGIN
// -------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("password", password)
      .maybeSingle();

    if (error || !data) {
      return res.json({ ok: false, error: "Invalid ID or Password" });
    }

    return res.json({
      ok: true,
      employee: {
        employee_id: data.employee_id,
        name: data.name,
        department: data.department,
        shift: data.shift
      }
    });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});
