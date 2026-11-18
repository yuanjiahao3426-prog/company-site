// ============================================
// 联系表单脚本
// ============================================

async function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';

    const formData = {
      name: form.name.value,
      company: form.company.value,
      email: form.email.value,
      phone: form.phone.value,
      category: form.category.value,
      message: form.message.value,
      created_at: new Date().toISOString()
    };

    const sb = await getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('contact_messages').insert([formData]);
        if (error) throw error;
      } catch (e) {
        console.error('提交失败:', e);
        alert('提交失败，请稍后重试或直接发送邮件');
        submitBtn.disabled = false;
        submitBtn.textContent = '提交咨询';
        return;
      }
    } else {
      // 未配置 Supabase 时，保存到本地
      const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      messages.push(formData);
      localStorage.setItem('contactMessages', JSON.stringify(messages));
    }

    form.innerHTML = '<div class="form-success">✅ 提交成功！我们会尽快与你联系。</div>';
  });
}

document.addEventListener('DOMContentLoaded', initContactForm);
