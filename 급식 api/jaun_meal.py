import requests
import datetime
import json
import re

def get_jaun_meal(date_str=None):
    """
    자운고등학교의 급식 정보를 나이스(NEIS) 오픈 API를 통해 가져옵니다.
    :param date_str: 'YYYYMMDD' 형식의 날짜 문자열. 생략 시 오늘 날짜 사용.
    """
    # 자운고등학교 기본 정보 (나이스 학교기본정보 API에서 확인)
    ATPT_OFCDC_SC_CODE = "B10" # 서울특별시교육청
    SD_SCHUL_CODE = "7010703"  # 자운고등학교
    
    if date_str is None:
        # 오늘 날짜 구하기 (YYYYMMDD 형식)
        now = datetime.datetime.now()
        date_str = now.strftime("%Y%m%d")
        
    url = "https://open.neis.go.kr/hub/mealServiceDietInfo"
    params = {
        "Type": "json",
        "ATPT_OFCDC_SC_CODE": ATPT_OFCDC_SC_CODE,
        "SD_SCHUL_CODE": SD_SCHUL_CODE,
        "MLSV_YMD": date_str
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status() # HTTP 에러 발생 시 예외 처리
        data = response.json()
        
        # 'mealServiceDietInfo' 키가 있는지 확인하여 데이터 존재 유무 판단
        if "mealServiceDietInfo" in data:
            # 중식 정보 (일반적으로 row[0]에 위치)
            meal_data = data["mealServiceDietInfo"][1]["row"][0]
            
            # 급식 메뉴 추출 및 <br/> 태그를 줄바꿈 문자로 변경
            raw_dish = meal_data.get("DDISH_NM", "")
            clean_dish = re.sub(r'<br\s*/?>', '\n', raw_dish)
            
            # 알레르기 유발 식품 표시(숫자)를 제거하고 싶다면 아래 주석을 해제하세요
            # clean_dish = re.sub(r'\([0-9\.]+\)', '', clean_dish)
            
            print(f"=== 자운고등학교 {date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일 급식 메뉴 ===")
            print(clean_dish)
            print("======================================================")
            
            cal_info = meal_data.get("CAL_INFO", "")
            print(f"칼로리: {cal_info}")
            
        else:
            print(f"{date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일에는 급식 정보가 없습니다 (주말, 공휴일, 방학 등).")
            
    except requests.exceptions.RequestException as e:
        print(f"API 요청 중 네트워크 오류가 발생했습니다: {e}")
    except json.JSONDecodeError:
        print("API 응답을 처리하는 데 실패했습니다.")
    except Exception as e:
        print(f"알 수 없는 오류가 발생했습니다: {e}")

if __name__ == "__main__":
    print("오늘의 자운고등학교 급식을 확인합니다...\n")
    # 오늘 급식 정보 출력
    get_jaun_meal()
    
    # 특정 날짜의 급식을 확인하고 싶다면 아래처럼 사용합니다
    # print("\n내일 급식 확인:")
    # get_jaun_meal("20260516")
