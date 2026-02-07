/**
 * 网站访客计数系统
 * 使用 localStorage 记录访问量
 */

(function() {
  'use strict';

  // ========== 访客计数功能 ==========
  
  /**
   * 获取总访问量
   */
  function getTotalVisits() {
    const visits = localStorage.getItem('jiuzhi_total_visits');
    return visits ? parseInt(visits, 10) : 0;
  }

  /**
   * 增加访问量
   */
  function incrementVisits() {
    const currentVisits = getTotalVisits();
    const newVisits = currentVisits + 1;
    localStorage.setItem('jiuzhi_total_visits', newVisits.toString());
    return newVisits;
  }

  /**
   * 检查是否是本次会话的首次访问
   */
  function isFirstVisitInSession() {
    return !sessionStorage.getItem('jiuzhi_visited');
  }

  /**
   * 标记本次会话已访问
   */
  function markSessionVisited() {
    sessionStorage.setItem('jiuzhi_visited', 'true');
  }

  /**
   * 格式化访问量显示
   */
  function formatVisits(visits) {
    if (visits >= 10000) {
      return (visits / 10000).toFixed(1) + '万';
    } else if (visits >= 1000) {
      return (visits / 1000).toFixed(1) + 'k';
    }
    return visits.toString();
  }

  /**
   * 更新页面上的访问量显示
   */
  function updateVisitDisplay() {
    const totalVisits = getTotalVisits();
    const visitCountElements = document.querySelectorAll('.visit-count');
    
    visitCountElements.forEach(element => {
      element.textContent = formatVisits(totalVisits);
    });
  }

  /**
   * 初始化访客计数
   */
  function initVisitCounter() {
    // 检查是否是本次会话的首次访问
    if (isFirstVisitInSession()) {
      // 增加访问量
      incrementVisits();
      // 标记本次会话已访问
      markSessionVisited();
    }
    
    // 更新页面显示
    updateVisitDisplay();
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisitCounter);
  } else {
    initVisitCounter();
  }

  // ========== 导出到全局 ==========
  
  window.JiuzhiVisit = {
    getTotalVisits: getTotalVisits,
    formatVisits: formatVisits,
    updateDisplay: updateVisitDisplay
  };

})();

